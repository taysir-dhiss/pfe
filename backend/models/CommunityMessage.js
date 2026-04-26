const mongoose = require("mongoose");

const communityMessageSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, required: true },
    username:        { type: String, required: true },
    userRole:        { type: String, enum: ["patiente", "admin"], required: true },
    content:         { type: String, required: true, maxlength: 2000 },
    // Map: emoji string -> array of userId strings who reacted
    reactions:       { type: Map, of: [String], default: {} },
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityMessage", default: null },
  },
  { timestamps: true }
);

communityMessageSchema.index({ parentMessageId: 1, createdAt: 1 });

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);
