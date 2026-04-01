// Routes admin - profil, CRUD admins, gestion patients, stats + recommandations
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const adminCtrl = require("../controllers/admin.controller");
const symptomCtrl = require("../controllers/symptom.controller");
const appointmentCtrl = require("../controllers/appointment.controller");
const notificationCtrl = require("../controllers/notification.controller");
const recCtrl = require("../controllers/recommendation.controller");

const isAdmin = [auth, authorize("admin")];

// ── Fixed paths first (MUST be before /:id to avoid shadowing) ───────────────

// Stats
router.get("/stats", isAdmin, adminCtrl.getStats);

// Profil admin
router.get("/profile", isAdmin, adminCtrl.getMyProfile);
router.put("/profile", isAdmin, adminCtrl.updateMyProfile);
router.put("/profile/password", isAdmin, adminCtrl.changeMyPassword);

// Gestion patients
router.get("/patients", isAdmin, adminCtrl.getAllPatients);
router.get("/patients/:id", isAdmin, adminCtrl.getPatientById);
router.put("/patients/:id", isAdmin, adminCtrl.updatePatient);
router.delete("/patients/:id", isAdmin, adminCtrl.deletePatient);

// Symptômes (lecture)
router.get("/symptoms", isAdmin, symptomCtrl.getAllSymptoms);

// Rendez-vous
router.get("/appointments", isAdmin, appointmentCtrl.getAllAppointments);
router.put("/appointments/:id/status", isAdmin, appointmentCtrl.updateStatus);

// Notifications
router.get("/notifications", isAdmin, notificationCtrl.getAllNotifications);
router.post("/notifications", isAdmin, notificationCtrl.createNotification);
router.delete("/notifications/:id", isAdmin, notificationCtrl.adminDeleteNotification);

// Recommandations
router.get("/recommendations", isAdmin, recCtrl.getAllRecommendations);
router.delete("/recommendations/:id", isAdmin, recCtrl.deleteRecommendation);

// ── Dynamic /:id routes last ──────────────────────────────────────────────────

// CRUD admins
router.get("/", isAdmin, adminCtrl.getAllAdmins);
router.get("/:id", isAdmin, adminCtrl.getAdminById);
router.put("/:id", isAdmin, adminCtrl.updateAdmin);
router.delete("/:id", isAdmin, adminCtrl.deleteAdmin);

module.exports = router;
