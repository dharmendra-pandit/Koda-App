import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.14:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.io server');
      if (userId) {
        this.socket?.emit('join_user', userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.io server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('🔌 Socket connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  joinRoom(room: string) {
    this.socket?.emit('join_room', room); // Backend doesn't have join_room yet, but good to have
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
