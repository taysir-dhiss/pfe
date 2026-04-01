// Routes recommandations - lecture patient, gestion admin
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const recCtrl = require("../controllers/recommendation.controller");

const isPatient = [auth, authorize("patiente")];

router.get("/", isPatient, recCtrl.getMyRecommendations);
router.get("/:id", isPatient, recCtrl.getRecommendationById);

module.exports = router;
