const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* =====================================================
   ✅ MARK ATTENDANCE (Present / Absent)
   One employee → one status per day
===================================================== */
router.post("/mark", async (req, res) => {
  const { employeeId, status } = req.body;

  if (!employeeId || !status) {
    return res.status(400).json({ message: "employeeId and status required" });
  }

  if (!["Present", "Absent"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await db.query(
      `
      INSERT INTO attendance (employee_id, date, status)
      VALUES (?, CURDATE(), ?)
      ON DUPLICATE KEY UPDATE status = ?
      `,
      [employeeId, status, status]
    );

    res.json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   📌 GET TODAY HR ATTENDANCE
   (Used to disable buttons + show status)
===================================================== */
router.get("/today/hr", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.employee_id, a.status
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date = CURDATE()
      AND e.position = 'HR'
    `);

    res.json(rows);
  } catch (error) {
    console.error("Today HR attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   📌 GET PRESENT EMPLOYEES (TODAY)
===================================================== */
router.get("/today/present", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.name, e.email, e.position
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date = CURDATE()
      AND a.status = 'Present'
    `);

    res.json(rows);
  } catch (error) {
    console.error("Present employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   📌 GET ABSENT EMPLOYEES (TODAY)
===================================================== */
router.get("/today/absent", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.name, e.email, e.position
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date = CURDATE()
      AND a.status = 'Absent'
    `);

    res.json(rows);
  } catch (error) {
    console.error("Absent employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
