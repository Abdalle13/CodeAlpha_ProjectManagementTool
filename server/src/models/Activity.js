import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      required: true,
      enum: ["created", "updated", "status_changed", "assigned", "commented", "deleted"],
    },
    description: { type: String, required: true, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

export const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
