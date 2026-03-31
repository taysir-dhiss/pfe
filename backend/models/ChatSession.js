const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient"
  }
}, { timestamps: true });

module.exports = mongoose.model("ChatSession", chatSessionSchema);