// Modèle ChatMessage — représente un message individuel dans une session de chatbot
// Chaque message appartient à une session et possède un rôle (patient ou IA)
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true }, // Référence à la session parente
  contenu:   { type: String, required: true, trim: true },                                 // Texte du message
  // Rôle de l'émetteur : "patient" pour le message de l'utilisateur, "assistant_ia" pour la réponse de l'IA
  role:      { type: String, enum: ["patient", "agent_systeme", "assistant_ia"], required: true },
  dateEnvoi: { type: Date, default: Date.now },  // Date d'envoi du message
  // Métadonnées générées par l'analyse IA lors de la classification des symptômes
  metadata: {
    confidence: { type: Number },                                                          // Score de confiance IA (0 à 1)
    severity:   { type: String, enum: ["low", "moderate", "high", "critical"] },           // Niveau de gravité détecté
    symptoms:   [{ type: String }],                                                        // Liste des symptômes extraits
  },
}, { timestamps: true });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
