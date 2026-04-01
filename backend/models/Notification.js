// Notification model - messages sent by admin to a patient
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    message: {
      type: String,
      required: [true, "Le message est obligatoire"],
      trim: true
    },
    dateEnvoi: {
      type: Date,
      default: Date.now
    },
    statut: {
      type: String,
      enum: ["non_lu", "lu"],
      default: "non_lu"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
