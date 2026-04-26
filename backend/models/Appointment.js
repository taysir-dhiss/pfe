// Appointment model — patient-owned, no admin approval
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  type: { type: String, trim: true, default: "Consultation" },
  date: { type: Date, required: [true, "La date est obligatoire"] },
  medecin: { type: String, trim: true },
  // Auto reminder (8h before)
  reminderSent: { type: Boolean, default: false },
  // Patient-programmed custom reminder
  customReminderDate: { type: Date, default: null },
  customReminderSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
