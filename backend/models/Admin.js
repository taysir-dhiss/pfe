const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  motDePasse: { type: String, required: true },
  role: { type: String, default: "admin", enum: ["admin"] }
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);