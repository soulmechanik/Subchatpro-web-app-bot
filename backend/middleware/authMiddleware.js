const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

const protect = asyncHandler(async (req, res, next) => {
  console.log("🔒 SubChat Protect Middleware running...");

  // --- 🍪 Log incoming cookies ---
  console.log("🍪 Incoming Cookies:", req.cookies);

  let token;

  // 1️⃣ First, check if token is in Cookies
  if (req.cookies?.token) {
    token = req.cookies.token;
    console.log("🍪 Extracted token from Cookie:", token);
  }

  // 2️⃣ Fallback to Authorization header if no token in Cookies
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    const splitToken = req.headers.authorization.split(" ")[1];
    if (splitToken && splitToken !== "null") {
      token = splitToken;
      console.log("🔑 Extracted token from Authorization header:", token);
    }
  }

  // 🚫 No token at all? Block access
  if (!token) {
    console.log("🚫 No token found (neither Authorization header nor cookie). Sending 401.");
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // 3️⃣ Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🛡️ Decoded JWT Payload:", decoded);

    // 4️⃣ Find the user in DB
    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      console.log("❌ User not found in database for decoded token userId:", decoded.userId);
      return res.status(401).json({ message: "User not found" });
    }

    // 5️⃣ Attach user to request
    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
      isSuperAdmin: user.role === "SuperAdmin",
      isGroupOwner: user.role === "GroupOwner",
      isSubscriber: user.role === "GroupSubscriber",
    };

    console.log("✅ User authenticated successfully, attached to req.user:", req.user);

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
});

module.exports = { protect };
