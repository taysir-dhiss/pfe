const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const appointmentCtrl = require("../controllers/appointment.controller");

const isPatient = [auth, authorize("patiente")];

// Named routes before /:id
router.post("/", isPatient, appointmentCtrl.createAppointment);
router.get("/", isPatient, appointmentCtrl.getMyAppointments);

// /:id routes
router.get("/:id", isPatient, appointmentCtrl.getAppointmentById);
router.put("/:id", isPatient, appointmentCtrl.updateAppointment);
router.delete("/:id", isPatient, appointmentCtrl.deleteAppointment);

// Custom reminder sub-routes
router.post("/:id/reminder", isPatient, appointmentCtrl.setCustomReminder);
router.delete("/:id/reminder", isPatient, appointmentCtrl.removeCustomReminder);

module.exports = router;
