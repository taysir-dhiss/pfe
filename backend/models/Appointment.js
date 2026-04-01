// Appointment model - patient scheduled appointments with doctor
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    type: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: [true, "La date est obligatoire"]
    },
    medecin: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
