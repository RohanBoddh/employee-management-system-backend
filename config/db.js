require("dotenv").config();
const mongoose = require("mongoose");

const FALLBACK_MONGO_URI =
  "mongodb+srv://rohanboddh9_db_user:JEkXWHKnUtqUG6cX@cluster0.2cdpohu.mongodb.net/employees?retryWrites=true&w=majority";

let cachedPromise = null;

const connectDB = async () => {
  // If already connected, return existing connection immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    FALLBACK_MONGO_URI;

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(mongoURI, {
        serverSelectionTimeoutMS: 15000,
      })
      .then((m) => {
        console.log("🚀 MongoDB Connected successfully to:", m.connection.host);
        return m.connection;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error("❌ MongoDB Connection Error:", err.message);
        throw err;
      });
  }

  return cachedPromise;
};

module.exports = connectDB;
