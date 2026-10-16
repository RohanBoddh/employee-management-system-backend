const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ===========================
   DASHBOARD STATS (HR)
=========================== */
router.get("/hr", async (req, res) => {
  try {
    // ✅ Total HR employees (employees = source of truth)
    const [[totalHR]] = await db.query(
      "SELECT COUNT(*) AS totalHR FROM employees WHERE position='HR'"
    );

    // ✅ Present HR today
    const [[presentToday]] = await db.query(
      `SELECT COUNT(*) AS presentToday
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.date = CURDATE()
       AND a.status = 'Present'
       AND e.position = 'HR'`
    );

    // ✅ Absent HR today
    const [[absentToday]] = await db.query(
      `SELECT COUNT(*) AS absentToday
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.date = CURDATE()
       AND a.status = 'Absent'
       AND e.position = 'HR'`
    );

    const absenteeRate =
      totalHR.totalHR === 0
        ? 0
        : Math.round(
            (absentToday.absentToday / totalHR.totalHR) * 100
          );

    res.json({
      totalHR: totalHR.totalHR,
      presentToday: presentToday.presentToday,
      absentToday: absentToday.absentToday,
      absenteeRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   ✅ PRESENT EMPLOYEES (TODAY)
=========================== */
router.get("/employees/present", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.name, e.email, e.position
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.date = CURDATE()
      AND a.status = 'Present'
      AND e.position = 'HR'
    `);

    res.json(rows);
  } catch (err) {
    console.error("Present employees error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   ✅ ABSENT EMPLOYEES (TODAY)
=========================== */
router.get("/employees/absent", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.name, e.email, e.position
      FROM employees e
      WHERE e.position = 'HR'
      AND e.id NOT IN (
        SELECT employee_id
        FROM attendance
        WHERE date = CURDATE()
        AND status = 'Present'
      )
    `);

    res.json(rows);
  } catch (err) {
    console.error("Absent HR employees error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
