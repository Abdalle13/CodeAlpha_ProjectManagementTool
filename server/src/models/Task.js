import mongoose from "mongoose";

export const TASK_STATUSES = ["todo", "in_progress", "in_review", "completed"];
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: false }
);

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    taskCode: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    status: { type: String, enum: TASK_STATUSES, default: "todo" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
    estimatedHours: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    checklist: { type: [checklistItemSchema], default: [] },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1, updatedAt: -1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ taskCode: 1 });

export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
