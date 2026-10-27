import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket, closeSocket } from './socket.js';
import { startHoldCleanupWorker, stopHoldCleanupWorker } from './services/holdCleanup.service.js';

let httpServer;

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`[Server] Warning: Server started but MongoDB connection failed: ${err.message}`);
  }

  httpServer = http.createServer(app);
  initSocket(httpServer);
  startHoldCleanupWorker(10000);

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] IMovies backend listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
    console.log(`[Server] Socket.IO real-time engine ready`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    stopHoldCleanupWorker();
    closeSocket();
    if (httpServer) {
      httpServer.close(() => {
        console.log('[Server] HTTP server closed');
      });
    }
    try {
      await disconnectDB();
    } catch (err) {
      console.error('[Server] Error disconnecting database during shutdown:', err);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err);
    process.exit(1);
  });
}

startServer();