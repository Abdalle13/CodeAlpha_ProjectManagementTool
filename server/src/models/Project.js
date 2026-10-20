import mongoose from "mongoose";

export const PROJECT_STATUSES = ["planned", "active", "on_hold", "completed"];
export const PROJECT_ROLES = ["owner", "admin", "member"];

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: PROJECT_ROLES, required: true, default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    status: { type: String, enum: PROJECT_STATUSES, default: "planned" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

projectSchema.index({ "members.user": 1, updatedAt: -1 });
projectSchema.index({ owner: 1 });

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
