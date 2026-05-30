const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    symptomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Symptom",
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    contenu: {
      type: String,
      required: [true, "Le contenu est obligatoire"],
      trim: true
    },
    dateGeneration: {
      type: Date,
      default: Date.now
    },
    niveauPriorite: {
      type: String,
      enum: ["faible", "modere", "eleve", "urgent"],
      default: "modere"
    },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", recommendationSchema);
