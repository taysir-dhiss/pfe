const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  motDePasse: { type: String, required: true },
  age: Number,
  sexe: String,
  telephone: String,
  adresse: String,
  historiqueMedical: String,
  role: { type: String, default: "patiente", enum: ["patiente"] }
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);