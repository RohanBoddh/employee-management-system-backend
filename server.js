require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");
const statsRoutes = require("./routes/statsRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const supportRoutes = require("./routes/supportRoutes");

const app = express();

// CORS configuration (allow requests from Vercel frontend and localhost)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Ensure MongoDB is connected for every request (cached in serverless)
app.use(async (req, res, next) => {
  // Let the root test route bypass if checking server health
  if (req.path === "/" || req.path === "/health") {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error in request:", err.message);
    return res.status(500).json({
      error: "Database connection failed",
      message: err.message,
    });
  }
});

// Test / Health route
app.get("/", (req, res) => {
  res.send("Backend is running with MongoDB 🚀");
});

app.get("/health", async (req, res) => {
  try {
    await connectDB();
    res.json({ status: "OK", database: "Connected to MongoDB" });
  } catch (err) {
    res.status(500).json({ status: "ERROR", error: err.message });
  }
});

// 🔹 Auth Routes
app.use("/api/auth", authRoutes);

// 🔹 Employee Routes
app.use("/api/employees", employeeRoutes);

// 🔹 Stats Routes
app.use("/stats", statsRoutes);

// 🔹 Attendance Routes
app.use("/attendance", attendanceRoutes);

// 🔹 Support Routes
app.use("/api/support", supportRoutes);

// Port
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  // Eager connect when running as a persistent process (local dev or Render)
  connectDB().catch((e) => console.warn("Initial DB connect warning:", e.message));

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
