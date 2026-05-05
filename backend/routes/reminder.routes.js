// Routes des rappels personnalisés — alarmes créées par la patiente (médicaments, soins, etc.)
// Supports trois types : "once" (ponctuel), "daily" (quotidien), "weekly" (hebdomadaire)
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const reminderCtrl = require("../controllers/reminder.controller");

const isPatient = [auth, authorize("patiente")];

router.get("/",             isPatient, reminderCtrl.getMyReminders);  // Lister ses rappels
router.post("/",            isPatient, reminderCtrl.createReminder);  // Créer un rappel
router.put("/:id",          isPatient, reminderCtrl.updateReminder);  // Modifier un rappel
router.patch("/:id/toggle", isPatient, reminderCtrl.toggleReminder); // Activer / désactiver un rappel
router.delete("/:id",       isPatient, reminderCtrl.deleteReminder);  // Supprimer un rappel

module.exports = router;
