import { io, Socket } from 'socket.io-client'

const SOCKET_URLS = [
  'https://koda-app-k7u3.onrender.com',
  'https://koda-app-985v.onrender.com',
]

class SocketService {
  private socket: Socket | null = null
  private currentIndex = 0
  private userId?: string

  connect(userId?: string) {
    this.userId = userId

    if (this.socket?.connected) return

    this.initSocket()
  }

  private initSocket() {
    const url = SOCKET_URLS[this.currentIndex]

    console.log('🔌 Trying:', url)

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: false, // ❗ important (we handle manually)
    })

    this.socket.on('connect', () => {
      console.log('✅ Connected:', url)

      if (this.userId) {
        this.socket?.emit('join_user', this.userId)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason)
      this.tryNextServer()
    })

    this.socket.on('connect_error', (error) => {
      console.log('⚠️ Error:', error.message)
      this.tryNextServer()
    })
  }

  private tryNextServer() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.close()
      this.socket = null
    }

    // switch server
    this.currentIndex = (this.currentIndex + 1) % SOCKET_URLS.length

    console.log('🔁 Switching to backup server...')

    setTimeout(() => {
      this.initSocket()
    }, 1000)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback)
  }

  off(event: string) {
    this.socket?.off(event)
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data)
  }

  joinRoom(room: string) {
    this.socket?.emit('join_room', room)
  }

  getSocket() {
    return this.socket
  }
}

export const socketService = new SocketService()
