import { Server } from 'socket.io';
import { env } from './config/env.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Client joins room for specific show
    socket.on('join:show', (showId) => {
      if (showId) {
        socket.join(`show:${showId}`);
      }
    });

    // Client leaves room for specific show
    socket.on('leave:show', (showId) => {
      if (showId) {
        socket.leave(`show:${showId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function closeSocket() {
  if (io) {
    io.close();
    io = null;
  }
}

// Broadcasting helpers scoped to room show:${showId}
export function emitSeatHeld(showId, payload) {
  if (io && showId) {
    io.to(`show:${showId}`).emit('seats:held', {
      showId,
      ...payload,
    });
  }
}

export function emitSeatReleased(showId, payload) {
  if (io && showId) {
    io.to(`show:${showId}`).emit('seats:released', {
      showId,
      ...payload,
    });
  }
}

export function emitSeatBooked(showId, payload) {
  if (io && showId) {
    io.to(`show:${showId}`).emit('seats:booked', {
      showId,
      ...payload,
    });
  }
}

export function emitSeatExpired(showId, payload) {
  if (io && showId) {
    io.to(`show:${showId}`).emit('seats:expired', {
      showId,
      ...payload,
    });
  }
}