const superAdminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: "Access denied: SuperAdmins only" });
    }
    next();
  };
  
  module.exports = { superAdminOnly };
  