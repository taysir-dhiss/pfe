// ChatMessage model - individual message within a chat session
const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true
    },
    contenu: {
      type: String,
      required: [true, "Le contenu du message est obligatoire"],
      trim: true
    },
    dateEnvoi: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ["patient", "agent_systeme", "assistant_ia"],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
