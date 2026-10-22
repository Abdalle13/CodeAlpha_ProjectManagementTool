import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, maxlength: 80 },
    summary: { type: String, required: true, maxlength: 240 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

export const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);