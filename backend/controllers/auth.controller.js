const Patient = require("../models/Patient");
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

exports.registerPatient = async (req, res) => {
  const hash = await bcrypt.hash(req.body.motDePasse, 10);

  const patient = await Patient.create({
    ...req.body,
    motDePasse: hash,
    role: "patiente"
  });

  res.json({ id: patient._id });
};

exports.registerAdmin = async (req, res) => {
  const hash = await bcrypt.hash(req.body.motDePasse, 10);

  const admin = await Admin.create({
    ...req.body,
    motDePasse: hash,
    role: "admin"
  });

  res.json({ id: admin._id });
};

exports.login = async (req, res) => {
  const { email, motDePasse } = req.body;

  let user = await Admin.findOne({ email });
  let role = "admin";

  if (!user) {
    user = await Patient.findOne({ email });
    role = "patiente";
  }

  if (!user) return res.status(404).json({ message: "User not found" });

  const valid = await bcrypt.compare(motDePasse, user.motDePasse);
  if (!valid) return res.status(400).json({ message: "Wrong password" });

  res.json({
    token: generateToken(user._id, role),
    role
  });
};