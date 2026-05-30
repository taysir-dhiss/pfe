const mongoose = require("mongoose");

const medicalChunkSchema = new mongoose.Schema(
  {
    sourceFile: { type: String, required: true },
    sourceId:   { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text:       { type: String, required: true },
    embedding:  { type: [Number], default: [] },
    charCount:  { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

medicalChunkSchema.index({ sourceId: 1, chunkIndex: 1 });

module.exports = mongoose.model("MedicalChunk", medicalChunkSchema);
