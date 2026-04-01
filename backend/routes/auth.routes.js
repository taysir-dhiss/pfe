// Public authentication routes (no token required)
const express = require("express");
const router = express.Router();
const { registerPatient, registerAdmin, login } = require("../controllers/auth.controller");

router.post("/register-patient", registerPatient);
router.post("/register-admin", registerAdmin);
router.post("/login", login);

module.exports = router;
