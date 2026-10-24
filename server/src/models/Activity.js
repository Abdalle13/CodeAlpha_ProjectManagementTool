import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: {
      type: String,
      required: true,
    },
    description: { type: String, default: "" },
    summary: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.pre("save", function(next) {
  if (!this.actor && this.user) this.actor = this.user;
  if (!this.user && this.actor) this.user = this.actor;
  if (!this.summary && this.description) this.summary = this.description;
  if (!this.description && this.summary) this.description = this.summary;
  next();
});

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });

export const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
