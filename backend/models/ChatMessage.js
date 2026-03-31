const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession"
  },
  sender: {
    type: String,
    enum: ["patient", "bot"]
  },
  message: String
}, { timestamps: true });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);