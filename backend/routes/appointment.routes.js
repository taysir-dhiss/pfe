// Routes des rendez-vous médicaux — CRUD + gestion des rappels personnalisés
// Toutes les routes sont réservées aux patientes
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const appointmentCtrl = require("../controllers/appointment.controller");

const isPatient = [auth, authorize("patiente")];

// Routes nommées placées avant /:id pour éviter les conflits de routage
router.post("/", isPatient, appointmentCtrl.createAppointment);  // Créer un rendez-vous
router.get("/",  isPatient, appointmentCtrl.getMyAppointments);  // Lister ses rendez-vous (triés par date)

// CRUD par identifiant
router.get("/:id",    isPatient, appointmentCtrl.getAppointmentById); // Détail d'un rendez-vous
router.put("/:id",    isPatient, appointmentCtrl.updateAppointment);  // Modifier un rendez-vous
router.delete("/:id", isPatient, appointmentCtrl.deleteAppointment);  // Supprimer un rendez-vous

// Sous-routes pour les rappels personnalisés (alarmes programmées par la patiente)
router.post("/:id/reminder",   isPatient, appointmentCtrl.setCustomReminder);    // Définir une date de rappel
router.delete("/:id/reminder", isPatient, appointmentCtrl.removeCustomReminder); // Supprimer le rappel

module.exports = router;
