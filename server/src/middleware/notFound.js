export function notFound(_req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: "The requested resource was not found.",
      code: "NOT_FOUND",
    },
  });
}
