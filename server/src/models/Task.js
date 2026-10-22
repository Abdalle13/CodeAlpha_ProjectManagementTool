import mongoose from "mongoose";

export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done"];
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 4000, default: "" },
    status: { type: String, enum: TASK_STATUSES, default: "todo" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1, updatedAt: -1 });
taskSchema.index({ assignee: 1, dueDate: 1 });

export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);