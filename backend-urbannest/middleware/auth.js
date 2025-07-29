//PROTECT THE MIDDLEWARE
const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const User = require("../models/User");
const { sanitizeInput } = require("../utils/xssProtection");

//Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Enhanced debugging for authentication issues
  console.log("=== Authentication Check ===");
  console.log("URL:", req.originalUrl);
  console.log("Method:", req.method);
  console.log("Authorization header:", req.headers.authorization ? "Present" : "Missing");

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
    console.log("Token extracted from Bearer header");
  }

  //Make sure token exist
  if (!token) {
    console.log("ERROR: No token provided");
    return res
      .status(401)
      .json({
        success: false,
        message: "Access denied. No token provided. Please log in.",
        details: "Authorization header with Bearer token is required"
      });
  }

  try {
    //Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully for user ID:", decoded.id);

    // Fetch user and sanitize user data
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log("ERROR: User not found for token");
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
        details: "The user associated with this token no longer exists"
      });
    }

    // Sanitize user data to prevent XSS
    if (user.email) {
      user.email = sanitizeInput(user.email);
    }
    if (user.name) {
      user.name = sanitizeInput(user.name);
    }

    req.user = user;
    console.log("User authenticated:", { id: user._id, email: user.email, role: user.role });
    next();
  } catch (err) {
    console.log("ERROR: Token verification failed:", err.message);
    return res
      .status(401)
      .json({
        success: false,
        message: "Invalid token. Please log in again.",
        details: err.name === 'TokenExpiredError' ? "Token has expired" : "Token is invalid"
      });
  }
});

// Grant access to specific roles , i.e publisher and admin

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Enhanced debugging for authorization issues
    console.log("=== Authorization Check ===");
    console.log("Required roles:", roles);
    console.log("User role:", req.user?.role);
    console.log("User ID:", req.user?._id);

    // Check if user exists
    if (!req.user) {
      console.log("ERROR: User not authenticated");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in first.",
        details: "User must be authenticated before authorization check"
      });
    }

    // Sanitize user role to prevent XSS
    const userRole = sanitizeInput(req.user.role || '');

    ///check if it is admin or publisher. user cannot access
    if (!roles.includes(userRole)) {
      console.log(`ERROR: Access denied. User role '${userRole}' not in required roles:`, roles);
      return res.status(403).json({
        success: false,
        message: `Access forbidden. User role '${userRole}' is not authorized to access this route.`,
        details: `Required roles: ${roles.join(', ')}. Your role: ${userRole}`
      });
    }

    console.log("Authorization successful for role:", userRole);
    next();
  };
};
