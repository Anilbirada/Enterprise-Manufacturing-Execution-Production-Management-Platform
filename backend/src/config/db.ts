import mongoose from 'mongoose';

let memoryServer: any = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  // 1. If a valid, non-placeholder MongoDB URI is provided, attempt connection
  if (uri && !uri.includes('cluster0.mongodb.net')) {
    try {
      console.log(`[DB] Attempting connection to MongoDB Atlas: ${uri.replace(/\/\/.*@/, '//***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 6000,
      });
      console.log('[DB] ✅ Connected to primary MongoDB Atlas successfully.');
      return;
    } catch (atlasErr: any) {
      console.warn(`[DB] Primary MongoDB Atlas connection failed (${atlasErr.message}). Initiating self-contained In-Memory MongoDB engine...`);
    }
  }

  // 2. Try standard local MongoDB instance (if running locally)
  try {
    console.log('[DB] Checking for local MongoDB service...');
    await mongoose.connect('mongodb://127.0.0.1:27017/rsrfactory360', {
      serverSelectionTimeoutMS: 1500,
    });
    console.log('[DB] ✅ Connected to local MongoDB service.');
    return;
  } catch {
    console.log('[DB] Local MongoDB service inactive. Initializing high-performance embedded In-Memory database...');
  }

  // 3. Guaranteed self-contained fallback: High-performance Embedded MongoDB Engine
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[DB] ✅ High-performance Embedded In-Memory MongoDB connected at: ${memoryUri}`);
    console.log('[DB] ✅ Zero-configuration mode active: All MES models, users, and workflows are fully operational!');
  } catch (memErr: any) {
    console.error('[DB Fatal] Unable to initialize embedded database engine:', memErr.message);
    throw memErr;
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
