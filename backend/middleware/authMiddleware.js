const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

const protect = asyncHandler(async (req, res, next) => {
  console.log("🔒 SubChat Protect Middleware running...");

  let token;

  // 1️⃣ Only check Authorization header for token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("🔑 Extracted token from Authorization header:", token);
  }

  // 🚫 No token at all? Block access
  if (!token) {
    console.log("🚫 No token found in Authorization header. Sending 401.");
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🛡️ Decoded JWT Payload:", decoded);

    // 3️⃣ Find the user in DB
    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      console.log("❌ User not found for decoded token userId:", decoded.userId);
      return res.status(401).json({ message: "User not found" });
    }

    // 4️⃣ Attach user to request
    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
      isSuperAdmin: user.role === "SuperAdmin",
      isGroupOwner: user.role === "GroupOwner",
      isSubscriber: user.role === "GroupSubscriber",
    };

    console.log("✅ User authenticated successfully and attached to req.user:", req.user);

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
});

module.exports = { protect };
