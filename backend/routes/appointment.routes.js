const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const appointmentCtrl = require("../controllers/appointment.controller");

const isPatient = [auth, authorize("patiente")];

router.post("/", isPatient, appointmentCtrl.createAppointment);
router.get("/", isPatient, appointmentCtrl.getMyAppointments);
router.get("/:id", isPatient, appointmentCtrl.getAppointmentById);
router.put("/:id", isPatient, appointmentCtrl.updateAppointment);
router.delete("/:id", isPatient, appointmentCtrl.deleteAppointment);

module.exports = router;
