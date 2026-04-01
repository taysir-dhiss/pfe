// ChatSession model - a conversation session between patient and chatbot
const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    type: {
      type: String,
      enum: ["poserQuest", "analyseSymptome", "general_support"],
      default: "general_support"
    },
    dateDebut: {
      type: Date,
      default: Date.now
    },
    datefin: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);
