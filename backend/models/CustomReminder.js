// CustomReminder — patient-created alarm reminders (medication, etc.)
// repeatType "once"   → fires at a specific datetime, then deactivates
// repeatType "daily"  → fires every day at a given time
// repeatType "weekly" → fires on selected weekdays at a given time
const mongoose = require("mongoose");

const customReminderSchema = new mongoose.Schema({
  patientId:  { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  label:      { type: String, required: true, trim: true },
  repeatType: { type: String, enum: ["once", "daily", "weekly"], required: true },
  // For "weekly": which days (0 = Sunday … 6 = Saturday)
  days:       [{ type: Number, min: 0, max: 6 }],
  // For "daily" / "weekly": time string "HH:MM"
  time:       { type: String, match: /^\d{2}:\d{2}$/ },
  // For "once": exact ISO datetime
  date:       { type: Date },
  active:     { type: Boolean, default: true },
  lastFiredAt:{ type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("CustomReminder", customReminderSchema);
