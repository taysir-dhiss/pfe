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
    userMessage      = "",
    history          = [],
    sessionType      = "general_support",
    semanticContext  = null,   // matching recommendation text (or null)
    semanticTier     = "none", // "high" | "medium" | "low" | "none"
    needsConsultation = false, // true → add medical consultation directive
    detectedCategory  = null,  // keyword-matched topic (e.g. "fatigue", "douleur")
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
${urgencyDirective}${semanticBlock}${categoryDirective}${consultationDirective}

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

// ── 4. Final Response Builder ─────────────────────────────────────────────────
/**
 * Converts pipeline outputs into a human-readable French response.
 *
 * @param {{ contenu: string, classification: object, analysis: object, safety: object, fallbackText?: string }}
 * @returns {string}
 */
function buildFinalResponse({ contenu, classification, analysis, safety, fallbackText = null }) {
  // If AI analysis failed, use the provided local fallback
  if (!analysis || !analysis.analysis) {
    const base = fallbackText || "Je suis là pour vous accompagner. N'hésitez pas à décrire vos symptômes plus précisément.";
    return `${base}\n\n${DISCLAIMER}`;
  }

  const parts = [];

  // Critical escalation banner (top)
  if (safety?.requiresEscalation) {
    parts.push("🚨 **Symptômes critiques détectés — Consultez votre équipe médicale immédiatement**\n");
  }

  // Main empathetic analysis
  parts.push(analysis.analysis);

  // Priority-labelled recommendations
  if (analysis.recommendations?.length > 0) {
    const lines = analysis.recommendations.map((r) => {
      const icon =
        r.priority === "urgent" ? "🔴" :
        r.priority === "high"   ? "🟠" :
        r.priority === "medium" ? "🟡" : "🟢";
      return `${icon} ${r.text}`;
    });
    parts.push(`\n**Recommandations :**\n${lines.join("\n")}`);
  }

  // Escalation / appointment footer
  if (safety?.requiresEscalation) {
    parts.push(
      "\n⚠️ **Vos symptômes nécessitent une attention médicale urgente. Veuillez prendre rendez-vous immédiatement.**"
    );
  } else if (safety?.suggestsAppointment) {
    parts.push(
      "\nJe vous encourage à en parler avec votre médecin lors de votre prochaine consultation — vous pouvez prendre rendez-vous depuis votre espace patient."
    );
  }

  // Medical disclaimer (always last)
  parts.push(`\n${DISCLAIMER}`);

  return parts.join("\n");
}

module.exports = { classifySymptoms, generateMedicalAnalysis, applySafetyFilter, buildFinalResponse };
