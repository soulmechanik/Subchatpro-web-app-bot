const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

// 🔐 Auth middleware for SubChat
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1️⃣ Prefer Authorization header (Bearer Token)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("🔑 Extracted token from Authorization header:", token);
  } 
  // 2️⃣ Fallback to Cookies (if Authorization missing)
  else if (req.cookies?.token) {
    token = req.cookies.token;
    console.log("🍪 Extracted token from cookie:", token);
  }

  // 🚫 If still no token, block
  if (!token) {
    console.log("🚫 No token found (Authorization header or cookie)");
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // ✅ Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🛡️ Decoded Token Payload:", decoded);

    // ✅ Find the user from DB
    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Attach user info to request
    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
      isSuperAdmin: user.role === "SuperAdmin",
      isGroupOwner: user.role === "GroupOwner",
      isSubscriber: user.role === "Subscriber",
    };

    console.log("✅ Authenticated User attached to req:", req.user);

    next(); // Proceed
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
});

module.exports = { protect };
