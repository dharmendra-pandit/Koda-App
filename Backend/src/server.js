import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./utils/socket.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Koda Server running on http://localhost:${PORT}`);
      console.log(`📡 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSockets: Ready`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
