const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient"
  },
  description: String,
  severity: {
    type: String,
    enum: ["low", "medium", "high"]
  }
}, { timestamps: true });

module.exports = mongoose.model("Symptom", symptomSchema);