const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

// 🔐 Auth middleware for SubChat
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // First: Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("🔑 Extracted Token from Authorization header:", token);
  } 
  // Second: Check cookies if Authorization header is not found
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("🍪 Extracted Token from cookies:", token);
  }

  // If no token found
  if (!token) {
    console.log("🚫 No token found in headers or cookies");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🛡️ Decoded Token:", decoded);

    // Find user
    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      console.log("❌ User not found in DB!");
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
      isSuperAdmin: user.role === 'SuperAdmin',
      isGroupOwner: user.role === 'GroupOwner',
      isSubscriber: user.role === 'Subscriber',
    };

    console.log("✅ Final Authenticated User Data:", req.user);

    next();
  } catch (error) {
    console.error("❌ Invalid token:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
});

module.exports = { protect };
