const OpenAI = require("openai");

const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

const DISCLAIMER_MARKER = "[AVERTISSEMENT]";
const DISCLAIMER =
  `${DISCLAIMER_MARKER} Cette réponse est générée par une IA et ne constitue pas un diagnostic médical. Consultez un professionnel de santé pour un avis médical adapté à votre situation.`;

// Liste des symptômes qui forcent toujours une escalade médicale, même si l'IA a sous-estimé la gravité
const CRITICAL_PATTERNS = [
  /douleur.{0,20}(thoracique|poitrine)/i,
  /dyspnée.{0,15}(sévère|aiguë|intense|soudaine)/i,
  /essoufflement.{0,15}(sévère|intense|soudain|brutal|repos)/i,
  /saignement.{0,15}(abondant|important|soudain)/i,
  /hémorragie/i,
  /\bconfusion\b/i,
  /désorientation/i,
  /perte.{0,10}connaissance/i,
  /syncope/i,
  /fièvre.{0,15}38[.,][5-9]/i,
];

// Crée le client OpenAI une seule fois et le réutilise pour tous les appels suivants
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant dans le fichier .env");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Envoie le message de la patiente au modèle IA et récupère les symptômes détectés, la gravité estimée et le niveau de confiance
async function classifySymptoms(message, history = []) {
  const histCtx = history
    .slice(-6)
    .map((m) => `${m.role === "patient" ? "Patient" : "Assistant"}: ${m.contenu.slice(0, 120)}`)
    .join("\n");

  const prompt = `Tu es un système de classification médicale spécialisé en oncologie du sein.
Analyse le message et extrait les informations médicales clés.
${histCtx ? `Contexte récent de la conversation :\n${histCtx}\n` : ""}Message actuel : "${message}"

Réponds UNIQUEMENT en JSON strict (aucun markdown, aucune explication) :
{"symptoms":["symptôme 1","symptôme 2"],"severity":"low|moderate|high|critical","confidence":0.0}

Règles de sévérité — sois précis :
- "critical" : douleur thoracique, dyspnée sévère soudaine, saignement abondant, confusion, perte de connaissance, fièvre ≥38.5°C sous chimio, chute brutale
- "high"     : douleur ≥7/10, vomissements répétés, fatigue extrême, infections, enflure importante, anxiété sévère
- "moderate" : douleur 4-6/10, nausées gérables, insomnie, perte d'appétit, anxiété modérée
- "low"      : symptômes légers, question générale, soutien émotionnel, information
Règles générales : déduis les symptômes implicites, ne te limite pas aux mots-clés exacts.`;

  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 220,
    temperature: 0.1,
  });

  const raw = completion.choices[0].message.content;
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error("Classifier: no JSON object in response — " + raw.slice(0, 80));

  const parsed = JSON.parse(match[0]);
  if (!parsed.severity || typeof parsed.confidence !== "number") {
    throw new Error("Classifier: invalid shape — " + match[0]);
  }

  return {
    symptoms:   Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    severity:   parsed.severity,
    confidence: Math.min(1, Math.max(0, parsed.confidence)),
  };
}

// Génère une analyse clinique structurée avec des recommandations, en injectant dans le prompt les extraits PDF et le contexte sémantique disponibles
async function generateMedicalAnalysis(classification, opts = {}) {
  const {
    userMessage       = "",
    history           = [],
    sessionType       = "general_support",
    semanticContext   = null,
    semanticTier      = "none",
    needsConsultation = false,
    detectedCategory  = null,
    ragChunks         = [],
  } = opts;
  const { symptoms, severity, confidence } = classification;

  const symptomList = symptoms.length > 0 ? symptoms.join(", ") : "symptômes non précisés";

  const histCtx = history
    .slice(-8)
    .map((m) => ({
      role:    m.role === "patient" ? "user" : "assistant",
      content: m.contenu,
    }));

  const urgencyDirective =
    severity === "critical"
      ? "URGENCE : indique clairement dans l'analyse que la patiente doit contacter son équipe médicale IMMÉDIATEMENT."
      : severity === "high"
      ? "CONSULTATION : suggère de consulter un médecin prochainement, sans être alarmant."
      : "";

  let ragBlock = "";
  if (ragChunks && ragChunks.length > 0) {
    const excerpts = ragChunks
      .map((c, i) => `[Extrait ${i + 1} — ${c.sourceFile}]\n${c.text.slice(0, 600)}`)
      .join("\n---\n");
    ragBlock = `

DOCUMENTATION MÉDICALE INDEXÉE (extraits pertinents) :
---
${excerpts}
---
Utilise ces extraits pour enrichir et préciser ta réponse si pertinent. Ne les reproduis pas verbatim. Ne cite pas les numéros d'extraits dans ta réponse.`;
  }

  let semanticBlock = "";
  if (semanticContext && (semanticTier === "high" || semanticTier === "medium")) {
    const label =
      semanticTier === "high"
        ? "Recommandation médicale similaire (similarité sémantique élevée)"
        : "Recommandation médicale proche (similarité sémantique modérée)";
    semanticBlock = `

${label} — déjà générée pour cette patiente :
"""
${semanticContext}
"""
Adapte ta réponse en tenant compte de ce contexte. Ne le reproduis pas mot pour mot.`;
  }

  const categoryDirective = detectedCategory
    ? `\n\nSUJET IDENTIFIÉ : "${detectedCategory}". Génère une réponse médicale structurée, spécifique et professionnelle sur ce sujet précis. La réponse doit contenir : (1) une validation empathique de ce que ressent la patiente, (2) une explication claire du symptôme dans le contexte du cancer du sein, (3) des conseils pratiques et détaillés, (4) les signaux d'alarme à surveiller. Ne sois pas vague ou générique — la réponse doit sembler vérifiée et fiable.`
    : "";

  const consultationDirective = needsConsultation
    ? "\nIMPORTANT : si la situation décrite est complexe, ambiguë ou dépasse les capacités d'analyse de l'IA, recommande explicitement de consulter un médecin ou un professionnel de santé, et rappelle qu'il ne s'agit pas d'un diagnostic médical."
    : "";

  const systemPrompt = `Tu es Sophie, assistante médicale IA en oncologie du sein (CalmCare).
Classification IA reçue : symptômes="${symptomList}" | sévérité="${severity}" | confiance=${(confidence * 100).toFixed(0)}%
${urgencyDirective}${ragBlock}${semanticBlock}${categoryDirective}${consultationDirective}

Génère une analyse clinique structurée. Réponds UNIQUEMENT avec ce JSON strict (aucun markdown) :
{
  "analysis": "2-3 phrases empathiques, non alarmantes, en français",
  "recommendations": [
    { "text": "Recommandation concrète et pratique", "priority": "low|medium|high|urgent" }
  ]
}
Règles :
- 2 à 4 recommandations, adaptées à la sévérité
- priority="urgent" uniquement si severity="critical"
- Jamais de diagnostic médical
- Si des extraits médicaux sont fournis, appuie tes recommandations dessus
- Toujours empathique et rassurant, mais précis`;

  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...histCtx,
      { role: "user", content: userMessage || `Analyser les symptômes : ${symptomList}` },
    ],
    max_tokens: 520,
    temperature: 0.35,
  });

  const raw = completion.choices[0].message.content
    .replace(/```json\n?|\n?```/g, "")
    .trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("MedicalAnalysis: no JSON object in response");

  const parsed = JSON.parse(match[0]);

  return {
    analysis:        typeof parsed.analysis === "string" ? parsed.analysis : "",
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
  };
}

// Vérifie si les symptômes détectés correspondent à une urgence médicale et retourne si une prise de rendez-vous est nécessaire
function applySafetyFilter(classification) {
  const { severity = "low", symptoms = [], confidence = 1 } = classification;

  const symptomText = symptoms.join(" ").toLowerCase();
  const hasCriticalSymptom = CRITICAL_PATTERNS.some((p) => p.test(symptomText));

  if (severity === "critical" || hasCriticalSymptom) {
    return {
      requiresEscalation: true,
      action:             "APPOINTMENT_REQUIRED",
      reason:             hasCriticalSymptom ? "critical_symptom_keyword" : "critical_severity",
    };
  }

  return {
    requiresEscalation:  false,
    suggestsAppointment: severity === "high" || confidence < 0.6,
  };
}

// Assemble le texte final de la réponse IA en Markdown à partir de l'analyse, des recommandations et du résultat du filtre de sécurité
function buildFinalResponse({ contenu, classification, analysis, safety, fallbackText = null }) {
  if (!analysis || !analysis.analysis) {
    const base = fallbackText || "Je suis là pour vous accompagner. N'hésitez pas à décrire vos symptômes plus précisément.";
    return `${base}\n\n${DISCLAIMER}`;
  }

  const parts = [];
  if (safety?.requiresEscalation) {
    parts.push("**Alerte : Symptômes critiques détectés — Consultez votre équipe médicale immédiatement**\n");
  }
  parts.push(analysis.analysis);
  if (analysis.recommendations?.length > 0) {
    const lines = analysis.recommendations.map((r) => `- ${r.text}`);
    parts.push(`\n**Recommandations :**\n${lines.join("\n")}`);
  }
  if (safety?.requiresEscalation) {
    parts.push("\n**Attention : Vos symptômes nécessitent une attention médicale urgente. Veuillez prendre rendez-vous immédiatement.**");
  } else if (safety?.suggestsAppointment) {
    parts.push("\nJe vous encourage à en parler avec votre médecin lors de votre prochaine consultation — vous pouvez prendre rendez-vous depuis votre espace patient.");
  }
  parts.push(`\n${DISCLAIMER}`);
  return parts.join("\n");
}

// Génère la réponse conversationnelle de Sophie en tenant compte de tout l'historique de la conversation, des extraits PDF pertinents et des recommandations passées de la patiente
async function generateConversationalResponse(classification, opts = {}) {
  const {
    userMessage       = "",
    history           = [],
    ragChunks         = [],
    semanticContext   = null,
    semanticTier      = "none",
    needsConsultation = false,
    detectedCategory  = null,
    safety            = {},
  } = opts;

  const { symptoms = [], severity = "low", confidence = 0.5 } = classification;
  const symptomList = symptoms.length > 0 ? symptoms.join(", ") : "non précisé";

  let urgencyNote = "";
  if (safety.requiresEscalation || severity === "critical") {
    urgencyNote =
      "\nURGENCE : indique CLAIREMENT à la patiente qu'elle doit contacter son équipe médicale IMMÉDIATEMENT. " +
      "Reste calme et rassurante — ne dramatise pas — mais sois ferme. Mentionne qu'elle peut prendre rendez-vous depuis son espace patient.";
  } else if (severity === "high") {
    urgencyNote = "\nSuggère de consulter un médecin dans les prochains jours. Naturellement, sans alarmer.";
  } else if (needsConsultation) {
    urgencyNote = "\nSi la situation te semble complexe ou ambiguë, recommande de consulter un professionnel de santé.";
  }

  let ragNote = "";
  if (ragChunks && ragChunks.length > 0) {
    const excerpts = ragChunks
      .map((c, i) => `[Source ${i + 1} — ${c.sourceFile}]\n${c.text.slice(0, 500)}`)
      .join("\n---\n");
    ragNote =
      "\n\nDOCUMENTATION MÉDICALE DE RÉFÉRENCE (extraits pertinents) :\n---\n" +
      excerpts +
      "\n---\nAppuie tes recommandations sur ces informations si pertinent. Ne les reproduis pas verbatim, ne cite pas les numéros de source.";
  }

  let semanticNote = "";
  if (semanticContext && (semanticTier === "high" || semanticTier === "medium")) {
    semanticNote =
      `\n\nRecommandation similaire déjà fournie à cette patiente :\n"${semanticContext}"\n` +
      "Ne la répète pas mot pour mot — enrichis et adapte.";
  }

  const categoryNote = detectedCategory
    ? `\n\nSujet identifié : "${detectedCategory}". Réponds de façon spécifique et pratique sur ce sujet.`
    : "";

  const systemPrompt =
    `Tu es Sophie, assistante médicale IA spécialisée en oncologie du sein pour CalmCare TN.\n\n` +

    `MÉMOIRE DE CONVERSATION — RÈGLE PRINCIPALE :\n` +
    `Tu as accès à l'intégralité de la conversation ci-dessous. Tu DOIS l'utiliser pour :\n` +
    `- Ne jamais répéter ce qui a déjà été dit ou conseillé\n` +
    `- Référencer naturellement les échanges précédents ("tu m'as dit que...", "comme on en a parlé...", "si je me souviens bien...", "tu m'avais expliqué...")\n` +
    `- Adapter ton ton selon l'évolution émotionnelle de la patiente au fil des échanges\n` +
    `- Construire sur tes réponses précédentes — ne repars jamais de zéro\n\n` +

    `STYLE DE RÉPONSE :\n` +
    `- Français naturel, humain, chaleureux — jamais robotique ni systématiquement en listes\n` +
    `- Phrases courtes et fluides, comme dans une vraie conversation\n` +
    `- Commence par reconnaître ce que la patiente ressent ou vient de dire\n` +
    `- Utilise "je" : "je comprends", "je t'entends", "je vois que..."\n` +
    `- Varie tes formulations selon le contexte émotionnel actuel\n` +
    `- Sois concise : 3-5 phrases bien choisies, jamais un long discours\n\n` +

    `ANALYSE CLINIQUE EN COURS :\n` +
    `Symptômes détectés : ${symptomList}\n` +
    `Sévérité estimée : ${severity}\n` +
    `Confiance IA : ${(confidence * 100).toFixed(0)}%` +
    `${urgencyNote}${ragNote}${semanticNote}${categoryNote}\n\n` +

    `RÈGLES ABSOLUES :\n` +
    `- Ne pose JAMAIS de diagnostic médical\n` +
    `- Génère une réponse UNIQUE en texte naturel (jamais du JSON, jamais de markdown excessif)\n` +
    `- Ne recommence PAS la conversation comme si c'était le premier message\n` +
    `- N'utilise pas d'emojis dans ta réponse.\n` +
    `- Termine TOUJOURS par exactement cette ligne sur une nouvelle ligne :\n` +
    `${DISCLAIMER_MARKER} Cette réponse est générée par une IA et ne constitue pas un diagnostic médical. Consultez un professionnel de santé pour un avis médical adapté à votre situation.`;

  const historyWithoutCurrent = history.slice(0, -1).slice(-14);
  const historyMessages = historyWithoutCurrent.map((m) => ({
    role:    m.role === "patient" ? "user" : "assistant",
    content: m.contenu,
  }));

  const currentMsg = userMessage || (history.length > 0 ? history[history.length - 1].contenu : "");

  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: currentMsg },
    ],
    max_tokens: 600,
    temperature: 0.55,
  });

  let response = completion.choices[0].message.content.trim();

  if (!response.includes(DISCLAIMER_MARKER)) {
    response += `\n\n${DISCLAIMER}`;
  }

  return response;
}

module.exports = {
  classifySymptoms,
  generateMedicalAnalysis,
  applySafetyFilter,
  buildFinalResponse,
  generateConversationalResponse,
};
