// Patient-only routes: own profile management
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const patientCtrl = require("../controllers/patient.controller");

const isPatient = [auth, authorize("patiente")];

router.get("/profile", isPatient, patientCtrl.getMyProfile);
router.put("/profile", isPatient, patientCtrl.updateMyProfile);
router.put("/profile/password", isPatient, patientCtrl.changeMyPassword);
router.delete("/profile", isPatient, patientCtrl.deleteMyAccount);

module.exports = router;
