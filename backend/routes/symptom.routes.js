// Routes de gestion des symptômes — CRUD complet réservé aux patientes
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const symptomCtrl = require("../controllers/symptom.controller");

const isPatient = [auth, authorize("patiente")];

router.post("/",    isPatient, symptomCtrl.createSymptom);    // Déclarer un nouveau symptôme
router.get("/",     isPatient, symptomCtrl.getMySymptoms);    // Lister tous ses symptômes
router.get("/:id",  isPatient, symptomCtrl.getSymptomById);   // Détail d'un symptôme
router.put("/:id",  isPatient, symptomCtrl.updateSymptom);    // Modifier un symptôme
router.delete("/:id", isPatient, symptomCtrl.deleteSymptom);  // Supprimer un symptôme

module.exports = router;
