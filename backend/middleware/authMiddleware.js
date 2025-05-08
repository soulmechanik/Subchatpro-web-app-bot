const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log("🔒 SubChat Protect Middleware running...");

  // 1️⃣ Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    const splitToken = req.headers.authorization.split(" ")[1];
    if (splitToken && splitToken !== "null") {
      token = splitToken;
      console.log("🔑 Extracted token from Authorization header:", token);
    }
  }

  // 2️⃣ Otherwise fallback to Cookies
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
    console.log("🍪 Extracted token from cookie:", token);
  }

  // 🚫 Still no token? Reject
  if (!token) {
    console.log("🚫 No token found (Authorization header or cookie)");
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🛡️ Decoded Token Payload:", decoded);

    // ✅ Find user
    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Attach user to req
    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
      isSuperAdmin: user.role === "SuperAdmin",
      isGroupOwner: user.role === "GroupOwner",
      isSubscriber: user.role === "GroupSubscriber",
    };

    console.log("✅ Authenticated User attached to req.user:", req.user);

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
});

module.exports = { protect };
