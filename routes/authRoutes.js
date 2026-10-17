const nodemailer = require("nodemailer");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "reset_secret_key";

/* =====================================================
   =============== FORGOT PASSWORD =====================
   ===================================================== */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "No registered user found with this email.",
      });
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const frontendBase =
      process.env.FRONTEND_URL ||
      "https://employee-management-system-frontend-liart.vercel.app";
    const resetLink = `${frontendBase}/reset-password/${token}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: normalizedEmail,
        subject: "Reset Your Password",
        html: `
          <h3>Password Reset</h3>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
          <p>This link will expire in 15 minutes.</p>
        `,
      });

      console.log("EMAIL SENT SUCCESS to:", normalizedEmail);
    } else {
      console.log("⚠️ EMAIL_USER/PASS not configured. Demo reset link:", resetLink);
    }

    res.json({
      message: "Reset link sent to email.",
      demoResetLink: process.env.NODE_ENV !== "production" ? resetLink : undefined,
    });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =====================================================
   =============== RESET PASSWORD ======================
   ===================================================== */
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({
      message: "Invalid or expired link",
    });
  }
});

/* =====================================================
   ===================== SIGNUP ========================
   ===================================================== */
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.password) {
      return res.status(400).json({
        message: "User already signed up. Please log in.",
      });
    }

    // Check employee record
    let emp = await Employee.findOne({ email: normalizedEmail });

    // If no employee exists yet, auto-create one so onboarding never fails!
    // If it's the first employee or user, give them HR position
    if (!emp) {
      const totalEmpCount = await Employee.countDocuments();
      const defaultPosition = totalEmpCount === 0 ? "HR" : "Employee";
      const displayName =
        name ||
        normalizedEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      emp = await Employee.create({
        name: displayName,
        email: normalizedEmail,
        position: defaultPosition,
        phone: "",
        address: "",
        salary: 50000,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.position = emp.position;
      existingUser.name = emp.name;
      await existingUser.save();
    } else {
      await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        role: emp.position.toUpperCase() === "HR" ? "hr" : "employee",
        position: emp.position,
        name: emp.name,
      });
    }

    res.status(201).json({
      message: "Signup successful",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      message: "Signup failed",
      error: err.message,
    });
  }
});

/* =====================================================
   ====================== LOGIN =========================
   ===================================================== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "User not found. Please sign up first.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Account not activated. Please sign up first.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    // Get matching employee record for fresh position/name
    const emp = await Employee.findOne({ email: normalizedEmail });
    const position = emp ? emp.position : user.position || "Employee";
    const name = emp ? emp.name : user.name || normalizedEmail.split("@")[0];

    const access = ["Dashboard"];
    if (position && position.toUpperCase() === "HR") {
      access.push("Employees");
    }

    res.json({
      message: "Login successful",
      email: user.email,
      name,
      role: user.role,
      position,
      access,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
});

/* =====================================================
   ================== GOOGLE LOGIN =====================
   ===================================================== */
router.post("/google-login", async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let emp = await Employee.findOne({ email: normalizedEmail });
    if (!emp) {
      emp = await Employee.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        position: "Employee",
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        role: "employee",
        position: emp.position,
        name: emp.name,
      });
    }

    const access = ["Dashboard"];
    if (emp.position && emp.position.toUpperCase() === "HR") {
      access.push("Employees");
    }

    res.json({
      message: "Google login successful",
      email: user.email,
      name: user.name || emp.name,
      role: user.role,
      position: emp.position,
      access,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

