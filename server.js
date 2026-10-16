require("dotenv").config();
const express = require("express");
const cors = require("cors");

const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");
const statsRoutes = require("./routes/statsRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const supportRoutes = require("./routes/supportRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// 🔹 Auth Routes
app.use("/api/auth", require("./routes/authRoutes"));


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
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
