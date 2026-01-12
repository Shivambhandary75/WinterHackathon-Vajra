const mongoose = require('mongoose');

module.exports.connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    // Create geospatial indexes
    const db = mongoose.connection.db;
    const reportCollection = db.collection("reports");

    // Create 2dsphere index for geospatial queries
    await reportCollection.createIndex({ "location.coordinates": "2dsphere" });
    console.log("Geospatial index created successfully");

    // Create additional indexes for performance
    await reportCollection.createIndex({ category: 1, status: 1 });
    await reportCollection.createIndex({ verified: 1 });
    await reportCollection.createIndex({ createdAt: -1 });
    console.log("Additional indexes created successfully");
  } catch (err) {
    console.log("MongoDB connection error:", err);
    process.exit(1);
  }
};