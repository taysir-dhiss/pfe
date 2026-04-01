// Patient model - stores patient account and medical data
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"]
    },
    motDePasse: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: 6
    },
    role: {
      type: String,
      default: "patiente",
      enum: ["patiente"]
    },
    dateNaissance: {
      type: Date
    },
    stadeCancer: {
      type: String,
      trim: true
    },
    historiqueMedical: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
