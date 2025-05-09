const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

const protect = asyncHandler(async (req, res, next) => {
  console.log("🔒 SubChat Protect Middleware running...");
  console.log("🍪 Incoming cookies:", req.cookies);
  console.log("📄 Incoming headers:", req.headers);

  let token = null;

  // 🛑 FIRST: Try to get token from cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("🍪 Extracted token from Cookie:", token);
  }
  // ➡️ SECOND: If no cookie, try Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    const headerToken = req.headers.authorization.split(" ")[1];
    if (headerToken !== "undefined") {
      token = headerToken;
      console.log("🔑 Extracted token from Authorization header:", token);
    } else {
      console.log("⚠️ Authorization header token is 'undefined'. Ignoring.");
    }
  }

  // 🚫 No token at all
  if (!token) {
    console.log("🚫 No token found. Sending 401 Unauthorized.");
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🛡️ Decoded JWT Payload:", decoded);

    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      console.log("❌ User not found for decoded userId:", decoded.userId);
      return res.status(401).json({ message: "User not found" });
    }

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
