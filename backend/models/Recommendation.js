const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  symptomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Symptom"
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient"
  },
  contenu: String,
  createdByAI: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Recommendation", recommendationSchema);