const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const symptomCtrl = require("../controllers/symptom.controller");

const isPatient = [auth, authorize("patiente")];

router.post("/", isPatient, symptomCtrl.createSymptom);
router.get("/", isPatient, symptomCtrl.getMySymptoms);
router.get("/:id", isPatient, symptomCtrl.getSymptomById);
router.put("/:id", isPatient, symptomCtrl.updateSymptom);
router.delete("/:id", isPatient, symptomCtrl.deleteSymptom);

module.exports = router;
