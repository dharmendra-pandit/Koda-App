import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all for now, can be restricted later
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join room for user-specific updates
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined their personal room`);
    });

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`🏠 Joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper to emit events easily
export const emitEvent = (event, data, room = null) => {
  if (!io) return;
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
};
