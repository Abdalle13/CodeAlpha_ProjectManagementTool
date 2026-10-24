import mongoose from "mongoose";

export const PROJECT_STATUSES = ["planning", "active", "paused", "completed"];
export const PROJECT_PRIORITIES = ["low", "medium", "high", "urgent"];

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "lead", "contributor", "viewer", "admin", "member"], default: "contributor" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    key: { type: String, required: true, trim: true, uppercase: true, minlength: 2, maxlength: 10 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    category: {
      type: String,
      enum: ["Engineering", "Product", "Design", "Infrastructure", "Security"],
      default: "Engineering",
    },
    status: { type: String, enum: PROJECT_STATUSES, default: "active" },
    priority: { type: String, enum: PROJECT_PRIORITIES, default: "medium" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    budget: { type: Number, default: 0 },
    taskSequence: { type: Number, default: 100 },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, updatedAt: -1 });
projectSchema.index({ "members.user": 1 });
projectSchema.index({ key: 1 });

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
