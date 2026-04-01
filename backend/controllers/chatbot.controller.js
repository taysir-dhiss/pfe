// ChatbotService - gestion sessions, messages, analyse symptômes via OpenAI (AIProvider)
const OpenAI = require("openai");
const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const Recommendation = require("../models/Recommendation");
const Symptom = require("../models/Symptom");
const Patient = require("../models/Patient");

// Lazy initialization - évite le crash au démarrage si OPENAI_API_KEY est absent
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY manquant dans le fichier .env");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

// POST /api/chat/sessions
exports.createSession = async (req, res) => {
  try {
    const { type } = req.body;
    const session = await ChatSession.create({
      patientId: req.user.id,
      type: type || "general_support",
      dateDebut: new Date()
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/chat/sessions
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ patientId: req.user.id }).sort({ dateDebut: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/chat/sessions/:id/close
exports.closeSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { datefin: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Messages + réponse IA ────────────────────────────────────────────────────

// POST /api/chat/sessions/:id/messages
exports.sendMessage = async (req, res) => {
  try {
    const { contenu } = req.body;
    if (!contenu) return res.status(400).json({ message: "Le message ne peut pas être vide" });

    const session = await ChatSession.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    if (session.datefin) return res.status(400).json({ message: "Session terminée" });

    // Sauvegarde du message patient
    await ChatMessage.create({
      sessionId: session._id,
      contenu,
      role: "patient"
    });

    // Historique pour contexte OpenAI
    const history = await ChatMessage.find({ sessionId: session._id })
      .sort({ dateEnvoi: 1 })
      .limit(20);

    const messages = [
      {
        role: "system",
        content: buildSystemPrompt(session.type)
      },
      ...history.map((m) => ({
        role: m.role === "patient" ? "user" : "assistant",
        content: m.contenu
      }))
    ];

    // Appel AIProvider (OpenAI)
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    // Sauvegarde de la réponse IA
    const botMessage = await ChatMessage.create({
      sessionId: session._id,
      contenu: aiResponse,
      role: "assistant_ia"
    });

    res.json({ response: botMessage });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/chat/sessions/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!session) return res.status(404).json({ message: "Session introuvable" });

    const messages = await ChatMessage.find({ sessionId: session._id }).sort({ dateEnvoi: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Analyse symptômes → recommandations IA ──────────────────────────────────

// POST /api/chat/analyser-symptomes
exports.analyserSymptomes = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-motDePasse");
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });

    const symptoms = await Symptom.find({ patientId: req.user.id }).sort({ dateDeclaration: -1 }).limit(10);
    if (!symptoms.length) {
      return res.status(400).json({ message: "Aucun symptôme enregistré pour l'analyse" });
    }

    const symptomList = symptoms
      .map((s) => `- ${s.type} (intensité: ${s.intensite}/10)`)
      .join("\n");

    const prompt = `Tu es un assistant médical spécialisé en oncologie.
Patiente : ${patient.nom}, stade cancer : ${patient.stadeCancer || "non renseigné"}.
Symptômes récents :\n${symptomList}
Génère des recommandations médicales claires et prioritaires. Format: JSON avec "recommandations" array où chaque item a "contenu" et "niveauPriorite" (faible|modere|eleve|urgent).`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.3
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      parsed = { recommandations: [{ contenu: completion.choices[0].message.content, niveauPriorite: "modere" }] };
    }

    // Sauvegarde des recommandations
    const saved = await Promise.all(
      parsed.recommandations.map((r) =>
        Recommendation.create({
          patientId: req.user.id,
          symptomId: symptoms[0]._id,
          contenu: r.contenu,
          niveauPriorite: r.niveauPriorite || "modere"
        })
      )
    );

    res.json({ recommandations: saved });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(sessionType) {
  const base = "Tu es un assistant médical bienveillant spécialisé en oncologie. Réponds en français, de façon claire et empathique.";
  if (sessionType === "analyseSymptome") {
    return `${base} L'objectif est d'analyser les symptômes du patient et d'évaluer leur gravité.`;
  }
  if (sessionType === "poserQuest") {
    return `${base} Réponds aux questions médicales générales du patient de façon précise mais sans remplacer un médecin.`;
  }
  return `${base} Apporte un soutien général au patient.`;
}
