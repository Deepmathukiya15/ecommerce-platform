const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * @param {string} uri - Mongo connection string (Atlas or local)
 */
const connectDB = async (uri) => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[db] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
