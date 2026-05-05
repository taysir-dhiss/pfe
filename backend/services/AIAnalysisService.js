/**
 * AIAnalysisService — Advanced AI pipeline for symptom classification,
 * medical reasoning, safety filtering, and response assembly.
 *
 * Pipeline: classifySymptoms → generateMedicalAnalysis → applySafetyFilter → buildFinalResponse
 */

const OpenAI = require("openai");

const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

const DISCLAIMER =
  "⚕️ *Cette réponse est générée par une IA et ne constitue pas un diagnostic médical. Consultez un professionnel de santé pour un avis médical adapté à votre situation.*";

// Patterns that always trigger escalation regardless of computed severity
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

// ── OpenAI singleton ──────────────────────────────────────────────────────────
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant dans le fichier .env");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ── 1. AI Symptom Classifier ──────────────────────────────────────────────────
/**
 * @param {string} message  Raw user message
 * @param {Array}  history  ChatMessage documents (optional, improves context)
 * @returns {{ symptoms: string[], severity: string, confidence: number }}
 */
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

// ── 2. Medical Reasoning Engine ───────────────────────────────────────────────
/**
 * @param {{ symptoms: string[], severity: string, confidence: number }} classification
 * @param {{ userMessage?: string, history?: Array, sessionType?: string }} opts
 * @returns {{ analysis: string, recommendations: Array<{text: string, priority: string}> }}
 */
async function generateMedicalAnalysis(classification, opts = {}) {
  const {
    userMessage       = "",
    history           = [],
    sessionType       = "general_support",
    semanticContext   = null,   // matching recommendation text (or null)
    semanticTier      = "none", // "high" | "medium" | "low" | "none"
    needsConsultation = false,  // true → add medical consultation directive
    detectedCategory  = null,   // keyword-matched topic (e.g. "fatigue", "douleur")
    ragChunks         = [],     // top-K chunks from RAG retrieval
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
      ? "⚠️ URGENCE : indique clairement dans l'analyse que la patiente doit contacter son équipe médicale IMMÉDIATEMENT."
      : severity === "high"
      ? "📋 CONSULTATION : suggère de consulter un médecin prochainement, sans être alarmant."
      : "";

  // ── RAG block — inject retrieved medical knowledge chunks ────────────────
  let ragBlock = "";
  if (ragChunks && ragChunks.length > 0) {
    const excerpts = ragChunks
      .map((c, i) => `[Extrait ${i + 1} — ${c.sourceFile}]\n${c.text.slice(0, 600)}`)
      .join("\n---\n");
    ragBlock = `

📚 DOCUMENTATION MÉDICALE INDEXÉE (extraits pertinents) :
---
${excerpts}
---
Utilise ces extraits pour enrichir et préciser ta réponse si pertinent. Ne les reproduis pas verbatim. Ne cite pas les numéros d'extraits dans ta réponse.`;
  }

  // Inject semantically matched recommendation as context when available
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

  // Category-specific structured response directive
  const categoryDirective = detectedCategory
    ? `\n\n📌 SUJET IDENTIFIÉ : "${detectedCategory}". Génère une réponse médicale structurée, spécifique et professionnelle sur ce sujet précis. La réponse doit contenir : (1) une validation empathique de ce que ressent la patiente, (2) une explication claire du symptôme dans le contexte du cancer du sein, (3) des conseils pratiques et détaillés, (4) les signaux d'alarme à surveiller. Ne sois pas vague ou générique — la réponse doit sembler vérifiée et fiable.`
    : "";

  // Consultation directive for ambiguous / complex cases
  const consultationDirective = needsConsultation
    ? "\n🩺 IMPORTANT : si la situation décrite est complexe, ambiguë ou dépasse les capacités d'analyse de l'IA, recommande explicitement de consulter un médecin ou un professionnel de santé, et rappelle qu'il ne s'agit pas d'un diagnostic médical."
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

// ── 3. Safety Filter ──────────────────────────────────────────────────────────
/**
 * @param {{ symptoms: string[], severity: string, confidence: number }} classification
 * @returns {{ requiresEscalation: boolean, action?: string, reason?: string, suggestsAppointment?: boolean }}
 */
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

// ── 4. Final Response Builder (kept as fallback) ─────────────────────────────
function buildFinalResponse({ contenu, classification, analysis, safety, fallbackText = null }) {
  if (!analysis || !analysis.analysis) {
    const base = fallbackText || "Je suis là pour vous accompagner. N'hésitez pas à décrire vos symptômes plus précisément.";
    return `${base}\n\n${DISCLAIMER}`;
  }

  const parts = [];
  if (safety?.requiresEscalation) {
    parts.push("🚨 **Symptômes critiques détectés — Consultez votre équipe médicale immédiatement**\n");
  }
  parts.push(analysis.analysis);
  if (analysis.recommendations?.length > 0) {
    const lines = analysis.recommendations.map((r) => {
      const icon = r.priority === "urgent" ? "🔴" : r.priority === "high" ? "🟠" : r.priority === "medium" ? "🟡" : "🟢";
      return `${icon} ${r.text}`;
    });
    parts.push(`\n**Recommandations :**\n${lines.join("\n")}`);
  }
  if (safety?.requiresEscalation) {
    parts.push("\n⚠️ **Vos symptômes nécessitent une attention médicale urgente. Veuillez prendre rendez-vous immédiatement.**");
  } else if (safety?.suggestsAppointment) {
    parts.push("\nJe vous encourage à en parler avec votre médecin lors de votre prochaine consultation — vous pouvez prendre rendez-vous depuis votre espace patient.");
  }
  parts.push(`\n${DISCLAIMER}`);
  return parts.join("\n");
}

// ── 5. Conversational Response with Full Memory ───────────────────────────────
/**
 * Generates a single natural-language reply that is fully aware of the entire
 * conversation history. Replaces the generateMedicalAnalysis → buildFinalResponse
 * two-step pipeline for follow-up messages.
 *
 * @param {{ symptoms: string[], severity: string, confidence: number }} classification
 * @param {{ userMessage, history, ragChunks, semanticContext, semanticTier,
 *            needsConsultation, detectedCategory, safety }} opts
 * @returns {Promise<string>}
 */
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

  // ── Urgency directive ──────────────────────────────────────────────────────
  let urgencyNote = "";
  if (safety.requiresEscalation || severity === "critical") {
    urgencyNote =
      "\n🚨 URGENCE : indique CLAIREMENT à la patiente qu'elle doit contacter son équipe médicale IMMÉDIATEMENT. " +
      "Reste calme et rassurante — ne dramatise pas — mais sois ferme. Mentionne qu'elle peut prendre rendez-vous depuis son espace patient.";
  } else if (severity === "high") {
    urgencyNote = "\n⚠️ Suggère de consulter un médecin dans les prochains jours. Naturellement, sans alarmer.";
  } else if (needsConsultation) {
    urgencyNote = "\n🩺 Si la situation te semble complexe ou ambiguë, recommande de consulter un professionnel de santé.";
  }

  // ── RAG knowledge excerpts ─────────────────────────────────────────────────
  let ragNote = "";
  if (ragChunks && ragChunks.length > 0) {
    const excerpts = ragChunks
      .map((c, i) => `[Source ${i + 1} — ${c.sourceFile}]\n${c.text.slice(0, 500)}`)
      .join("\n---\n");
    ragNote =
      "\n\n📚 DOCUMENTATION MÉDICALE DE RÉFÉRENCE (extraits pertinents) :\n---\n" +
      excerpts +
      "\n---\nAppuie tes recommandations sur ces informations si pertinent. Ne les reproduis pas verbatim, ne cite pas les numéros de source.";
  }

  // ── Semantic context ────────────────────────────────────────────────────────
  let semanticNote = "";
  if (semanticContext && (semanticTier === "high" || semanticTier === "medium")) {
    semanticNote =
      `\n\nRecommandation similaire déjà fournie à cette patiente :\n"${semanticContext}"\n` +
      "Ne la répète pas mot pour mot — enrichis et adapte.";
  }

  // ── Category hint ──────────────────────────────────────────────────────────
  const categoryNote = detectedCategory
    ? `\n\nSujet identifié : "${detectedCategory}". Réponds de façon spécifique et pratique sur ce sujet.`
    : "";

  // ── System prompt ──────────────────────────────────────────────────────────
  const systemPrompt =
    `Tu es Sophie, assistante médicale IA spécialisée en oncologie du sein pour CalmCare TN.\n\n` +

    `🧠 MÉMOIRE DE CONVERSATION — RÈGLE PRINCIPALE :\n` +
    `Tu as accès à l'intégralité de la conversation ci-dessous. Tu DOIS l'utiliser pour :\n` +
    `- Ne jamais répéter ce qui a déjà été dit ou conseillé\n` +
    `- Référencer naturellement les échanges précédents ("tu m'as dit que...", "comme on en a parlé...", "si je me souviens bien...", "tu m'avais expliqué...")\n` +
    `- Adapter ton ton selon l'évolution émotionnelle de la patiente au fil des échanges\n` +
    `- Construire sur tes réponses précédentes — ne repars jamais de zéro\n\n` +

    `💬 STYLE DE RÉPONSE :\n` +
    `- Français naturel, humain, chaleureux — jamais robotique ni systématiquement en listes\n` +
    `- Phrases courtes et fluides, comme dans une vraie conversation\n` +
    `- Commence par reconnaître ce que la patiente ressent ou vient de dire\n` +
    `- Utilise "je" : "je comprends", "je t'entends", "je vois que..."\n` +
    `- Varie tes formulations selon le contexte émotionnel actuel\n` +
    `- Sois concise : 3-5 phrases bien choisies, jamais un long discours\n\n` +

    `🏥 ANALYSE CLINIQUE EN COURS :\n` +
    `Symptômes détectés : ${symptomList}\n` +
    `Sévérité estimée : ${severity}\n` +
    `Confiance IA : ${(confidence * 100).toFixed(0)}%` +
    `${urgencyNote}${ragNote}${semanticNote}${categoryNote}\n\n` +

    `⚠️ RÈGLES ABSOLUES :\n` +
    `- Ne pose JAMAIS de diagnostic médical\n` +
    `- Génère une réponse UNIQUE en texte naturel (jamais du JSON, jamais de markdown excessif)\n` +
    `- Ne recommence PAS la conversation comme si c'était le premier message\n` +
    `- Termine TOUJOURS par exactement cette ligne sur une nouvelle ligne :\n` +
    `⚕️ *Cette réponse est générée par une IA et ne constitue pas un diagnostic médical. Consultez un professionnel de santé pour un avis médical adapté à votre situation.*`;

  // ── Conversation history — exclude current user message (last entry in history)
  // history already contains the saved current user message as its last item;
  // we separate it so it appears as the explicit final "user" turn.
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

  // Guarantee disclaimer is present even if the model omitted it
  if (!response.includes("⚕️")) {
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
