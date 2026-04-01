// Handles registration and login for Admin and Patient
const Patient = require("../models/Patient");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

exports.registerPatient = async (req, res) => {
  try {
    const { nom, email, motDePasse, dateNaissance, historiqueMedical, stadeCancer } = req.body;

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: "nom, email et motDePasse sont obligatoires" });
    }
    if (motDePasse.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const hash = await bcrypt.hash(motDePasse, 10);
    const patient = await Patient.create({
      nom,
      email,
      motDePasse: hash,
      dateNaissance,
      historiqueMedical,
      stadeCancer,
      role: "patiente"
    });

    res.status(201).json({ id: patient._id, nom: patient.nom, email: patient.email });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: "nom, email et motDePasse sont obligatoires" });
    }
    if (motDePasse.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const hash = await bcrypt.hash(motDePasse, 10);
    const admin = await Admin.create({ nom, email, motDePasse: hash, role: "admin" });

    res.status(201).json({ id: admin._id, nom: admin.nom, email: admin.email });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "email et motDePasse sont obligatoires" });
    }

    let user = await Admin.findOne({ email });
    let role = "admin";

    if (!user) {
      user = await Patient.findOne({ email });
      role = "patiente";
    }

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const valid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect" });

    res.json({
      token: generateToken(user._id, role),
      role,
      id: user._id,
      nom: user.nom
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
