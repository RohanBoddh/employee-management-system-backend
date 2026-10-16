require("dotenv").config();
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,        // your DB host
  user: process.env.DB_USER,        // your DB user
  password: process.env.DB_PASSWORD, // your DB password
  database: process.env.DB_NAME,     // your DB name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
