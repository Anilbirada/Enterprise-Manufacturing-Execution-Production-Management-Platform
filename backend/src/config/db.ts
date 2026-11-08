import mongoose from 'mongoose';

let memoryServer: any = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri) {
      console.log(`[DB] Attempting connection to MongoDB: ${uri.replace(/\/\/.*@/, '//***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('[DB] MongoDB Connected successfully.');
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('========================================================================');
      console.error('🚨 [FATAL CONFIGURATION ERROR] MONGODB_URI is missing on Render!');
      console.error('RSR Factory360 MES requires a MongoDB connection string in production.');
      console.error('Please configure MONGODB_URI in your Render Dashboard:');
      console.error('  1. Open Render Dashboard -> Service -> Environment');
      console.error('  2. Add Key: MONGODB_URI');
      console.error('  3. Add Value: mongodb+srv://<user>:<password>@cluster0.xyz.mongodb.net/rsrfactory360?retryWrites=true&w=majority');
      console.error('========================================================================');
      throw new Error('MONGODB_URI environment variable is required in production.');
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

    // Fallback to embedded MongoDB for local dev or tests
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'rsrfactory360',
          port: 27017
        }
      });
      const memoryUri = memoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Embedded MongoDB engine initialized and connected at: ${memoryUri}`);
    } catch (memErr: any) {
      console.error('[DB] Embedded MongoDB failed to initialize:', memErr.message);
      throw memErr;
    }
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
