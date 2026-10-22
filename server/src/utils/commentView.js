export function publicComment(comment) {
  return {
    id: String(comment._id || comment.id),
    project: String(comment.project),
    task: String(comment.task),
    author: comment.author?.name
      ? { id: String(comment.author._id), name: comment.author.name }
      : { id: String(comment.author) },
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}