export function publicComment(comment) {
  return {
    id: String(comment._id || comment.id),
    project: String(comment.project),
    task: String(comment.task),
    author: {
      id: String(comment.author?._id || comment.author?.id || comment.author || ""),
      name: comment.author?.name || "Member",
    },
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}