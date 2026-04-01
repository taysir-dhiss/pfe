// Symptom model - patient-reported symptoms with type, intensity and date
const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    type: {
      type: String,
      required: [true, "Le type de symptôme est obligatoire"],
      trim: true
    },
    intensite: {
      type: Number,
      min: 1,
      max: 10,
      required: [true, "L'intensité est obligatoire"]
    },
    dateDeclaration: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Symptom", symptomSchema);
