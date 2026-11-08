import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { setSocketIOInstance } from './adapters/notificationAdapter';
import { IndustrialSimulationAdapter } from './adapters/industrialSimulationAdapter';
import { seedDatabase } from './seed/seed';
import { User } from './models/User';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

setSocketIOInstance(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('join_plant', (plantId: string) => {
    socket.join(`plant:${plantId}`);
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

// Broadcast simulated industrial telemetry over Socket.IO
IndustrialSimulationAdapter.onTelemetry((telemetry) => {
  io.emit('industrial_telemetry', telemetry);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'RSR Factory360 MES Backend Engine',
    timestamp: new Date(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Mount modular API Router
app.use('/api', apiRouter);

// Serve frontend SPA static files if built
import path from 'path';
import fs from 'fs';

const potentialDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist')
];

let staticDistPath = '';
for (const p of potentialDistPaths) {
  if (fs.existsSync(p)) {
    staticDistPath = p;
    break;
  }
}

if (staticDistPath) {
  app.use(express.static(staticDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(staticDistPath, 'index.html'));
  });
  console.log(`[Server] Serving frontend SPA from ${staticDistPath}`);
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'ONLINE',
      service: 'RSR Factory360 MES Backend Engine',
      message: 'MES Backend is running. Frontend static build will be served once generated.',
      health: '/api/health'
    });
  });
}

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

export { app, server };

if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(async () => {
      // Check if DB needs initial seeding
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Server] First boot detected. Running initial factory master seeding...');
        await seedDatabase();
      }

      // Start background read-only industrial telemetry simulation
      IndustrialSimulationAdapter.startSimulation(4000);

      server.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`====================================================`);
        console.log(`🚀 RSR FACTORY360 MES BACKEND RUNNING ON PORT ${PORT}`);
        console.log(`🏭 Industrial Hub: Jigani & Bommasandra, Bengaluru`);
        console.log(`🔌 REST API & Real-time WebSockets Ready`);
        console.log(`====================================================`);
      });
    })
    .catch((err) => {
      console.error('[Server Start Failure]', err);
      process.exit(1);
    });
}
