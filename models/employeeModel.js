const db = require("../config/db");

exports.getAllEmployees = (callback) => {
  db.query("SELECT * FROM employees", callback);
};

exports.getEmployeeById = (id, callback) => {
  db.query("SELECT * FROM employees WHERE id = ?", [id], callback);
};

exports.createEmployee = (data, callback) => {
  db.query("INSERT INTO employees SET ?", data, callback);
};

exports.updateEmployee = (id, data, callback) => {
  db.query("UPDATE employees SET ? WHERE id = ?", [data, id], callback);
};

exports.deleteEmployee = (id, callback) => {
  db.query("DELETE FROM employees WHERE id = ?", [id], callback);
};
