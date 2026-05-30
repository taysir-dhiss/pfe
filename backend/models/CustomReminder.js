const mongoose = require("mongoose");

const customReminderSchema = new mongoose.Schema({
  patientId:  { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  label:      { type: String, required: true, trim: true },
  repeatType: { type: String, enum: ["once", "daily", "weekly"], required: true },
  days:       [{ type: Number, min: 0, max: 6 }],
  time:       { type: String, match: /^\d{2}:\d{2}$/ },
  date:       { type: Date },
  active:     { type: Boolean, default: true },
  lastFiredAt:{ type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("CustomReminder", customReminderSchema);
