/**
 * @FILE: databaseConnection.js
 * @RESPONSIBILITY: Production Mongoose MongoDB connection pooling with connection monitoring.
 * @DEPENDENCIES: mongoose, dotenv.
 * @MODIFICATION_HOTSPOT: Mongoose connection options and URI fallback.
 * @AUTHOR: Garima Mittal, Principal Enterprise Solutions Architect
 */

import mongoose from 'mongoose';

export const connectToDatabase = async () => {
  const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clubsphere_erp';

  const connectionPoolOptions = {
    autoIndex: true,
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  try {
    const databaseConnection = await mongoose.connect(mongoConnectionString, connectionPoolOptions);
    console.log(`[DB Connection]: MongoDB cluster connected at host ${databaseConnection.connection.host}`);
    return databaseConnection;
  } catch (connectionError) {
    console.error(`[DB Error]: Failed to connect to MongoDB cluster: ${connectionError.message}`);
    throw connectionError;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DB Event]: MongoDB cluster disconnected. Reconnection attempt queued.');
});

mongoose.connection.on('error', (eventError) => {
  console.error(`[DB Event Error]: MongoDB runtime connection error: ${eventError.message}`);
});
