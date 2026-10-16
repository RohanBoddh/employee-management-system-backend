const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/hr", async (req, res) => {
  try {
    const [[totalEmployees]] = await db.query(
      "SELECT COUNT(*) AS total FROM employees"
    );

    const [[presentToday]] = await db.query(
      `SELECT COUNT(DISTINCT employee_id) AS present
       FROM attendance
       WHERE date = CURDATE()
       AND status = 'Present'`
    );

    const present = presentToday.present;
    const total = totalEmployees.total;
    const absent = total - present;

    const absenteeRate =
      total === 0 ? 0 : Math.round((absent / total) * 100);

    res.json({
      totalEmployees: total,
      presentToday: present,
      absentToday: absent,
      absenteeRate,
    });
  } catch (err) {
    console.error("HR stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
