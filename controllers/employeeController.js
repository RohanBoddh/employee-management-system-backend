const db = require("../config/db");

// Get all employees (HR only)
exports.getEmployees = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employees");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get single employee by ID (all authenticated users)
exports.getEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM employees WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Employee not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get single employee by email (all authenticated users)
exports.getEmployeeByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM employees WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ error: "Employee not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching employee by email:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add new employee (HR only)
exports.addEmployee = async (req, res) => {
  const { name, email, position, phone, address, salary } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO employees (name, email, position, phone, address, salary) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, position, phone, address, salary || null]
    );
    res.status(201).json({ id: result.insertId, name, email, position, phone, address, salary });
  } catch (err) {
    console.error("Error adding employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update employee (HR only)
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, position, phone, address, salary } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE employees SET name = ?, email = ?, position = ?, phone = ?, address = ?, salary = ? WHERE id = ?",
      [name, email, position, phone, address, salary || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete employee (HR only)
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM employees WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
