// Restricts access to routes based on user role
module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Accès interdit — rôle requis: ${roles.join(", ")} (actuel: ${req.user.role})`
    });
  }
  next();
};
