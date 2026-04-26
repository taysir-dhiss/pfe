// Admin routes — patient CRUD, medical content, stats. No appointments, no notifications.
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const adminCtrl = require("../controllers/admin.controller");

const isAdmin = [auth, authorize("admin")];

// Stats
router.get("/stats", isAdmin, adminCtrl.getStats);

// Admin profile
router.get("/profile",          isAdmin, adminCtrl.getMyProfile);
router.put("/profile",          isAdmin, adminCtrl.updateMyProfile);
router.put("/profile/password", isAdmin, adminCtrl.changeMyPassword);

// Patient management (full CRUD)
router.get("/patients",     isAdmin, adminCtrl.getAllPatients);
router.get("/patients/:id", isAdmin, adminCtrl.getPatientById);
router.put("/patients/:id", isAdmin, adminCtrl.updatePatient);
router.delete("/patients/:id", isAdmin, adminCtrl.deletePatient);

// Admin CRUD (keep /:id last to avoid shadowing named routes)
router.get("/",      isAdmin, adminCtrl.getAllAdmins);
router.get("/:id",   isAdmin, adminCtrl.getAdminById);
router.put("/:id",   isAdmin, adminCtrl.updateAdmin);
router.delete("/:id",isAdmin, adminCtrl.deleteAdmin);

module.exports = router;
