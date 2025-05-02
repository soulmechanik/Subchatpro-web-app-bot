const groupOwnerOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'GroupOwner') {
      return res.status(403).json({ message: "Access denied: GroupOwners only" });
    }
    next();
  };
  
  module.exports = { groupOwnerOnly };
  