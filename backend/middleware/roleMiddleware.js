const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userRole = req.user.role_name;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access Restricted. Required roles: ${allowedRoles.join(', ')}.`
      });
    }
    next();
  };
};

module.exports = roleMiddleware;
