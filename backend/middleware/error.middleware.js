// Global error handler - catches all unhandled errors passed via next(err)
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Erreur serveur",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
