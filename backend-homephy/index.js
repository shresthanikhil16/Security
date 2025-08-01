const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const connectDb = require("./config/db");
const { securityMiddleware, xssProtection } = require("./middleware/security");
const { noSqlInjectionProtection } = require("./middleware/noSqlInjection");
const { apiRateLimiter } = require("./middleware/rateLimiter");
const AuthRouter = require("./routes/authRoutes");
const protectedRouter = require("./routes/protectedRoutes");
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const emailRoutes = require("./routes/emailRoutes");
const contactRoutes = require("./routes/contactRoutes");
const esewaRoutes = require("./routes/esewaRoutes");
const auditRoutes = require("./routes/auditRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const flatRoutes = require("./routes/flatRoutes");
const { csrfProtection, generateCSRFToken } = require("./middleware/csrf");
require("dotenv").config();

const app = express();

// Connect to MongoDB with error handling
connectDb().catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Security middleware - Helmet for XSS protection and other security headers
app.use(securityMiddleware);
app.use(xssProtection);

// 🛡️ NoSQL Injection Protection - Apply before parsing request bodies
app.use(express.json());
app.use(noSqlInjectionProtection);

// Middleware
app.use(
  cors({
    origin: [
      "https://localhost:5173",
      "http://localhost:5173",
      "https://localhost:5174",
      "http://localhost:5174"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "CSRF-Token",
      "Cache-Control",
      "x-request-time",
      "X-Request-Time",
      "Accept",
      "Origin",
      "User-Agent",
      "DNT",
      "Keep-Alive",
      "X-Requested-With",
      "If-Modified-Since",
      "Range"
    ],
    credentials: true, // Important for cookies
    exposedHeaders: ["Content-Type", "Content-Length", "X-CSRF-Token", "Cache-Control"]
  })
);
app.use(cookieParser());

// Apply API rate limiting to all routes
app.use("/api", apiRateLimiter);

// Serve static files with proper headers for images
app.use("/uploads", (req, res, next) => {
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Cache-Control", "public, max-age=31536000");
  next();
}, express.static("uploads"));

// Serve JavaScript files (analytics helper, etc.)
app.use("/js", (req, res, next) => {
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Content-Type", "application/javascript");
  res.header("Cache-Control", "public, max-age=3600"); // 1 hour cache
  next();
}, express.static("public/js"));

// CSRF protection for all routes except GET and specific endpoints
app.use(csrfProtection);

// CSRF token endpoint
app.get("/api/auth/csrf-token", generateCSRFToken);

// Alternative CSRF token endpoint for frontend compatibility
app.get("/api/csrf-token", generateCSRFToken);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Shoephy API Server is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      csrf: "/api/csrf-token",
      test: "/test"
    }
  });
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
});

// Fallback image endpoint for missing images
app.get("/fallback-image.png", (req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");

  // Return a simple SVG placeholder
  const fallbackSvg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle" dy=".3em">
        🏠 Image Not Available
      </text>
      <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dy=".3em">
        Homefy Property
      </text>
    </svg>
  `;

  res.send(fallbackSvg);
});

// Route handling
app.use("/api/auth", AuthRouter);
app.use("/api/protected", protectedRouter);
app.use("/api/rooms", roomRoutes);
app.use("/api/user", userRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/esewa", esewaRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/flats", flatRoutes);

// HTTPS server
const port = 3000;
const httpsOptions = {
  key: fs.readFileSync("./.cert/key.pem"),
  cert: fs.readFileSync("./.cert/cert.pem"),
};

try {
  https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`Server running at https://localhost:${port}`);
  });
} catch (err) {
  console.error("Failed to start HTTPS server:", err);
  process.exit(1);
}