const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeController");
const Employee = require("../models/Employee");
const User = require("../models/User");

/* ===============================
   🔹 EMPLOYEE CRUD
================================ */

// All employees
router.get("/", controller.getEmployees);

// Get employee by email
router.get("/email/:email", controller.getEmployeeByEmail);

// Add employee
router.post("/", async (req, res) => {
  const { name, email, position, phone, address, salary } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1️⃣ Upsert in Employee collection
    const employee = await Employee.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name,
        email: normalizedEmail,
        position: position || "Employee",
        phone: phone || "",
        address: address || "",
        salary: salary ? Number(salary) : 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2️⃣ Sync role in User collection if user exists or if position is HR
    if (position === "HR") {
      await User.findOneAndUpdate(
        { email: normalizedEmail },
        { role: "hr", position: "HR", name },
        { upsert: false }
      );
    }

    res.json({ success: true, message: "Employee saved & synced", employee });
  } catch (err) {
    console.error("Employee save error:", err);
    res.status(500).json({ error: "Save failed", details: err.message });
  }
});

// Update employee by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, position, phone, address, salary } = req.body;

  try {
    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        name,
        email: email ? email.toLowerCase().trim() : undefined,
        position,
        phone,
        address,
        salary: salary ? Number(salary) : 0,
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Sync User record if position changed
    if (employee.email) {
      await User.findOneAndUpdate(
        { email: employee.email },
        {
          role: position === "HR" ? "hr" : "employee",
          position,
          name: name || undefined,
        }
      );
    }

    res.json({ success: true, message: "Employee updated", employee });
  } catch (err) {
    console.error("Employee update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Delete employee by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const emp = await Employee.findByIdAndDelete(id);

    if (emp && emp.position === "HR") {
      await User.findOneAndDelete({ email: emp.email });
    }

    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    console.error("Employee delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ID route always last
router.get("/:id", controller.getEmployee);

module.exports = router;
