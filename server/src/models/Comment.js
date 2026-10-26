import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, maxlength: 3000 },
    body: { type: String, trim: true, maxlength: 3000 },
  },
  { timestamps: true }
);

commentSchema.pre("validate", function (next) {
  if (!this.content && this.body) this.content = this.body;
  if (!this.body && this.content) this.body = this.content;
  if (!this.content && !this.body) {
    this.invalidate("body", "Comment body is required.");
  }
  next();
});

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ project: 1, createdAt: -1 });

export const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
