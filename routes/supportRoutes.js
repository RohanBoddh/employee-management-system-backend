const express = require("express");
const router = express.Router();
const db = require("../config/db");
const nodemailer = require("nodemailer");

// Submit Report
router.post("/submit-report", async (req, res) => {
  const { name, email, issue } = req.body;

  try {
    await db.query(
      "INSERT INTO support_reports (name, email, issue) VALUES (?, ?, ?)",
      [name, email, issue]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: email,
      to: "hr@gmail.com",
      subject: "New Employee Support Report",
      text: `Name: ${name}\nEmail: ${email}\nIssue: ${issue}`,
    });

    res.status(200).json({ message: "Report submitted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 🔥 ADD THIS GET ROUTE
router.get("/all-reports", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM support_reports ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/delete-report/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM support_reports WHERE id = ?", [id]);
    res.json({ message: "Report resolved and removed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
