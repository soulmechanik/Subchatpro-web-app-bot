const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

// 🔐 Auth middleware for SubChat
const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log("🔍 Checking Authorization Header:", req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("🔑 Extracted Token:", token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🛡️ Decoded Token:", decoded);

      const user = await User.findById(decoded.userId).select("_id role");

      if (!user) {
        console.log("❌ User not found in DB!");
        return res.status(401).json({ message: "User not found" });
      }

      console.log("✅ User Authenticated:", user);

      req.user = {
        _id: user._id.toString(),
        userId: user._id.toString(),
        role: user.role,
        isSuperAdmin: user.role === 'SuperAdmin',
        isGroupOwner: user.role === 'GroupOwner',
        isSubscriber: user.role === 'Subscriber',
      };

      console.log("🆔 Final Authenticated User Data:", req.user);
      next();
    } catch (error) {
      console.error("❌ Invalid token:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log("🚫 No Authorization Header Found!");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
});

module.exports = { protect };
