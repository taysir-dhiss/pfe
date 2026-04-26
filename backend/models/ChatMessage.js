const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true },
  contenu:   { type: String, required: true, trim: true },
  role:      { type: String, enum: ["patient", "agent_systeme", "assistant_ia"], required: true },
  dateEnvoi: { type: Date, default: Date.now },
  metadata: {
    confidence: { type: Number },
    severity:   { type: String, enum: ["low", "moderate", "high", "critical"] },
    symptoms:   [{ type: String }],
  },
}, { timestamps: true });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
