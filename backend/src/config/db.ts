import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri) {
      console.log(`[DB] Attempting connection to configured MongoDB: ${uri.replace(/\/\/.*@/, '//***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[DB] MongoDB Connected successfully.');
      return;
    }

    // Try standard localhost:27017 first
    try {
      console.log('[DB] Checking local MongoDB instance at mongodb://127.0.0.1:27017/rsrfactory360...');
      await mongoose.connect('mongodb://127.0.0.1:27017/rsrfactory360', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('[DB] Connected to local MongoDB.');
      return;
    } catch {
      console.log('[DB] Local MongoDB instance not active. Starting embedded MongoDB engine for self-contained operation...');
    }

    // Fallback to embedded MongoDB
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'rsrfactory360',
        port: 27017
      }
    });
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[DB] Embedded MongoDB engine initialized and connected at: ${memoryUri}`);
  } catch (err: any) {
    console.error('[DB] MongoDB connection failure:', err.message);
    throw err;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('[DB] Disconnected from MongoDB.');
  } catch (err: any) {
    console.error('[DB] Error during disconnect:', err.message);
  }
};
