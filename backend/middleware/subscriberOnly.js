const subscriberOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'Subscriber') {
      return res.status(403).json({ message: "Access denied: Subscribers only" });
    }
    next();
  };
  
  module.exports = { subscriberOnly };
  