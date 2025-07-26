const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const connectDb = require("./config/db");
const AuthRouter = require("./routes/authRoutes");
const protectedRouter = require("./routes/protectedRoutes");
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const emailRoutes = require("./routes/emailRoutes");
const contactRoutes = require("./routes/contactRoutes");
const esewaRoutes = require("./routes/esewaRoutes");
require("dotenv").config();

const app = express();

// Connect to MongoDB with error handling
connectDb().catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Middleware
app.use(
  cors({
    origin: ["https://localhost:5173", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
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