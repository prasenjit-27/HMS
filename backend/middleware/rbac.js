const rbac = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    if (req.user.role === 'doctor' && !req.user.isApproved) {
      const allowedPaths = ['/profile', '/api/doctor/profile'];
      const isAllowed = allowedPaths.some(path => req.originalUrl.includes(path));
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending admin approval.',
        });
      }
    }
    next();
  };
};
module.exports = rbac;
