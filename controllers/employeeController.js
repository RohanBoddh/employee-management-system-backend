const Employee = require("../models/Employee");

// Get all employees (HR only)
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get single employee by ID
exports.getEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get single employee by email
exports.getEmployeeByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const employee = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("Error fetching employee by email:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add new employee
exports.addEmployee = async (req, res) => {
  const { name, email, position, phone, address, salary } = req.body;
  try {
    const existing = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: "Employee with this email already exists" });
    }

    const employee = await Employee.create({
      name,
      email: email.toLowerCase().trim(),
      position: position || "Employee",
      phone: phone || "",
      address: address || "",
      salary: salary ? Number(salary) : 0,
    });

    res.status(201).json(employee);
  } catch (err) {
    console.error("Error adding employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
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
      { new: true, runValidators: true }
    );

    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee updated successfully", employee });
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
