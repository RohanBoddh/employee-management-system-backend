const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

/* ===========================
   DASHBOARD STATS (HR)
=========================== */
router.get("/hr", async (req, res) => {
  try {
    const today = getTodayDateStr();

    const hrEmployees = await Employee.find({ position: /^hr$/i }).select("_id");
    const hrIds = hrEmployees.map((e) => e._id);
    const totalHR = hrEmployees.length;

    const presentCount = await Attendance.countDocuments({
      date: today,
      status: "Present",
      employee_id: { $in: hrIds },
    });

    const absentCount = await Attendance.countDocuments({
      date: today,
      status: "Absent",
      employee_id: { $in: hrIds },
    });

    const absenteeRate =
      totalHR === 0 ? 0 : Math.round((absentCount / totalHR) * 100);

    res.json({
      totalHR,
      presentToday: presentCount,
      absentToday: absentCount,
      absenteeRate,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   ✅ PRESENT EMPLOYEES (TODAY)
=========================== */
router.get("/employees/present", async (req, res) => {
  try {
    const today = getTodayDateStr();
    const hrEmployees = await Employee.find({ position: /^hr$/i }).select("_id");
    const hrIds = hrEmployees.map((e) => e._id);

    const attendances = await Attendance.find({
      date: today,
      status: "Present",
      employee_id: { $in: hrIds },
    }).populate("employee_id");

    const rows = attendances
      .filter((a) => a.employee_id)
      .map((a) => ({
        id: a.employee_id._id.toString(),
        name: a.employee_id.name,
        email: a.employee_id.email,
        position: a.employee_id.position,
      }));

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
    const today = getTodayDateStr();
    const presentAttendances = await Attendance.find({
      date: today,
      status: "Present",
    }).select("employee_id");

    const presentEmpIds = presentAttendances.map((a) => a.employee_id.toString());

    const absentEmployees = await Employee.find({
      position: /^hr$/i,
      _id: { $nin: presentEmpIds },
    });

    const rows = absentEmployees.map((e) => ({
      id: e._id.toString(),
      name: e.name,
      email: e.email,
      position: e.position,
    }));

    res.json(rows);
  } catch (err) {
    console.error("Absent HR employees error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
