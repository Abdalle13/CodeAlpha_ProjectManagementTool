import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 3000 },
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ project: 1, createdAt: -1 });

export const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
