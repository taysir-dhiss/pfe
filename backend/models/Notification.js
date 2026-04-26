// Notification model — created by scheduler, deleted when read
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  message:       { type: String, required: true, trim: true },
  type:          { type: String, enum: ["appointment", "alarm"], required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
  read:          { type: Boolean, default: false },
  triggerTime:   { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
