const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeController");
const db = require("../config/db");

/* ===============================
   🔹 EMPLOYEE CRUD
================================ */

// All employees
router.get("/", controller.getEmployees);

router.get("/email/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM employees WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add employee
router.post("/", async (req, res) => {
  const { name, email, position } = req.body;

  try {
    // 1️⃣ Employees table
    await db.query(
      `INSERT INTO employees (name, email, position)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name=?, position=?`,
      [name, email, position, name, position]
    );

    // 2️⃣ Users table (only HR)
    if (position === "HR") {
      await db.query(
        `INSERT INTO users (email, role)
         VALUES (?, 'HR')
         ON DUPLICATE KEY UPDATE role='HR'`,
        [email]
      );
    }

    res.json({ success: true, message: "Employee saved & synced" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Save failed" });
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, position } = req.body;

  try {
    await db.query(
      "UPDATE employees SET name=?, email=?, position=? WHERE id=?",
      [name, email, position, id]
    );

    // HR sync
    if (position === "HR") {
      await db.query(
        `INSERT INTO users (email, role)
         VALUES (?, 'HR')
         ON DUPLICATE KEY UPDATE role='HR'`,
        [email]
      );
    }

    res.json({ success: true, message: "Employee updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Delete employee
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // email fetch (to delete from users if HR)
    const [[emp]] = await db.query(
      "SELECT email, position FROM employees WHERE id=?",
      [id]
    );

    await db.query("DELETE FROM employees WHERE id=?", [id]);

    if (emp && emp.position === "HR") {
      await db.query("DELETE FROM users WHERE email=?", [emp.email]);
    }

    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ⚠️ ID route ALWAYS LAST
router.get("/:id", controller.getEmployee);

module.exports = router;
