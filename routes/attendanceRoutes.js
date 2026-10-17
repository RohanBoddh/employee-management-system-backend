const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

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
    return res.status(400).json({ message: "Invalid status. Must be Present or Absent" });
  }

  try {
    const today = getTodayDateStr();

    await Attendance.findOneAndUpdate(
      { employee_id: employeeId, date: today },
      { status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Attendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* =====================================================
   📌 GET TODAY HR ATTENDANCE
   (Used to disable buttons + show status)
===================================================== */
router.get("/today/hr", async (req, res) => {
  try {
    const today = getTodayDateStr();
    const hrEmployees = await Employee.find({ position: /^hr$/i }).select("_id");
    const hrIds = hrEmployees.map((e) => e._id);

    const attendances = await Attendance.find({
      date: today,
      employee_id: { $in: hrIds },
    });

    const result = attendances.map((a) => ({
      employee_id: a.employee_id.toString(),
      status: a.status,
    }));

    res.json(result);
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
    const today = getTodayDateStr();
    const attendances = await Attendance.find({
      date: today,
      status: "Present",
    }).populate("employee_id");

    const result = attendances
      .filter((a) => a.employee_id)
      .map((a) => ({
        id: a.employee_id._id.toString(),
        name: a.employee_id.name,
        email: a.employee_id.email,
        position: a.employee_id.position,
      }));

    res.json(result);
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
    const today = getTodayDateStr();
    const attendances = await Attendance.find({
      date: today,
      status: "Absent",
    }).populate("employee_id");

    const result = attendances
      .filter((a) => a.employee_id)
      .map((a) => ({
        id: a.employee_id._id.toString(),
        name: a.employee_id.name,
        email: a.employee_id.email,
        position: a.employee_id.position,
      }));

    res.json(result);
  } catch (error) {
    console.error("Absent employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
