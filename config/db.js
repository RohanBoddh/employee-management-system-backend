require("dotenv").config();
const mongoose = require("mongoose");

let isConnected = false;

const FALLBACK_MONGO_URI =
  "mongodb+srv://rohanboddh9_db_user:JEkXWHKnUtqUG6cX@cluster0.2cdpohu.mongodb.net/employees?retryWrites=true&w=majority";

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    FALLBACK_MONGO_URI;

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false, // Don't buffer operations if disconnected
    });
    isConnected = true;
    console.log("🚀 MongoDB Connected successfully to:", conn.connection.host);
    return conn;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    throw err;
  }
};

module.exports = connectDB;
