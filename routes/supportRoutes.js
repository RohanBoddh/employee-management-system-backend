const express = require("express");
const router = express.Router();
const SupportReport = require("../models/SupportReport");
const nodemailer = require("nodemailer");

// Submit Report
router.post("/submit-report", async (req, res) => {
  const { name, email, issue } = req.body;

  if (!name || !email || !issue) {
    return res.status(400).json({ error: "Name, email, and issue are required" });
  }

  try {
    const report = await SupportReport.create({
      name,
      email: email.toLowerCase().trim(),
      issue,
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: email,
        to: process.env.EMAIL_USER,
        subject: "New Employee Support Report",
        text: `Name: ${name}\nEmail: ${email}\nIssue: ${issue}`,
      });
    }

    res.status(200).json({ message: "Report submitted successfully", report });
  } catch (err) {
    console.error("Support submit error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET all reports
router.get("/all-reports", async (req, res) => {
  try {
    const reports = await SupportReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("Fetch reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE report
router.delete("/delete-report/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const report = await SupportReport.findByIdAndDelete(id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ message: "Report resolved and removed" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
