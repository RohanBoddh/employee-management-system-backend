require("dotenv").config();
const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI) {
    const errorMsg =
      "MONGO_URI environment variable is missing. Please add MONGO_URI in Vercel Project Settings -> Environment Variables.";
    console.error("❌ " + errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
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
