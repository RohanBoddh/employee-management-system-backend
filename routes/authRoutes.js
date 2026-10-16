const nodemailer = require("nodemailer");
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const router = express.Router();
const jwt = require("jsonwebtoken");

/* =====================================================
   =============== FORGOT PASSWORD =====================
   ===================================================== */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // check employee table
    const [emp] = await db.query(
      "SELECT email FROM employees WHERE email = ?",
      [email]
    );

    if (emp.length === 0) {
      return res.status(400).json({
        message: "This email is not registered as employee.",
      });
    }

    // check users table
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: "User account not activated please sign up first.",
      });
    }

    const userId = rows[0].id;

    const token = jwt.sign(
      { id: userId },
      "reset_secret_key",
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    // EMAIL TRANSPORTER
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Password",
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    console.log("EMAIL SENT SUCCESS");

    res.json({
      message: "Reset link sent to email.",
    });

  } catch (err) {
    console.log("EMAIL ERROR:", err);
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

  try {
    const decoded = jwt.verify(token, "reset_secret_key");
    const userId = decoded.id;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({
      message: "Password reset successful",
    });

  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "Invalid or expired link",
    });
  }
});

/* =====================================================
   ===================== SIGNUP ========================
   ===================================================== */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required."
    });
  }

  try {
    const [emp] = await db.query(
      "SELECT position FROM employees WHERE email = ?",
      [email]
    );

    if (emp.length === 0) {
      return res.status(400).json({
        message: "Email not registered as employee",
      });
    }

    const [existingUser] = await db.query(
      "SELECT password FROM users WHERE email = ?",
      [email]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser.length > 0 && !existingUser[0].password) {
      await db.query(
        "UPDATE users SET password = ?, position = ? WHERE email = ?",
        [hashedPassword, emp[0].position, email]
      );

      return res.json({
        message: "Account activated successfully",
      });
    }

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "User already signed up",
      });
    }

    await db.query(
      "INSERT INTO users (email, password, role, position) VALUES (?, ?, 'employee', ?)",
      [email, hashedPassword, emp[0].position]
    );

    res.status(201).json({
      message: "Signup successful",
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      message: "Signup failed",
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

  try {
    const [users] = await db.query(
      `SELECT 
         users.email,
         users.password,
         users.role,
         users.position,
         employees.name
       FROM users
       JOIN employees ON users.email = employees.email
       WHERE users.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: "User not found.",
      });
    }

    const user = users[0];

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

    let access = ["Dashboard"];
    if (user.position && user.position.toUpperCase() === "HR") {
      access.push("Employees");
    }

    res.json({
      message: "Login successful",
      email: user.email,
      name: user.name,
      role: user.role,
      position: user.position,
      access,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Login failed",
    });
  }
});

module.exports = router;
