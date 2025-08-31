const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");

// --------------------
// App & Server Setup
// --------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // TODO: restrict in production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// --------------------
// MongoDB Connection
// --------------------
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://aarshjain2022:aarshjain@cluster0.grnmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --------------------
// Schemas & Models
// --------------------
const RoomSchema = new mongoose.Schema({
  name: { type: String, unique: true, index: true }
});
const Room = mongoose.model("Room", RoomSchema);

const MessageSchema = new mongoose.Schema({
  room: { type: String, index: true },
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

// --------------------
// Socket.IO Handlers
// --------------------
io.on("connection", async (socket) => {
  console.log("🔗 User connected:", socket.id);

  // Send available rooms
  try {
    const rooms = await Room.find().lean();
    socket.emit("roomList", rooms.map((r) => r.name));
  } catch (err) {
    console.error("Error fetching rooms:", err);
  }

  // Create room
  socket.on("createRoom", async (roomName) => {
    try {
      const exists = await Room.findOne({ name: roomName });
      if (!exists) {
        await new Room({ name: roomName }).save();
      }
      const allRooms = await Room.find().lean();
      io.emit("roomList", allRooms.map((r) => r.name));
    } catch (err) {
      console.error("createRoom error:", err);
    }
  });

  // Join room
  socket.on("joinRoom", async (room) => {
    try {
      socket.join(room);

      // Send system message
      socket.emit("message", {
        sender: "System",
        text: `You joined ${room}`,
        timestamp: new Date()
      });

      // Send last 100 messages
      const chatHistory = await Message.find({ room })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
      socket.emit("chatHistory", chatHistory.reverse());
    } catch (err) {
      console.error("joinRoom error:", err);
    }
  });

  // Chat messages
  socket.on("chatMessage", async ({ room, message }) => {
    try {
      const msg = { sender: socket.id, text: message, timestamp: new Date() };
      io.to(room).emit("message", msg);

      await Message.create({ room, sender: socket.id, text: message });
    } catch (err) {
      console.error("chatMessage error:", err);
    }
  });

  // -----------------------------
  // WebRTC Signaling
  // -----------------------------
  socket.on("offer", ({ sdp, room }) => {
    if (!room || !sdp) return;
    console.log(`📡 Offer from ${socket.id} in room ${room}`);
    socket.to(room).emit("offer", { sdp, from: socket.id });
  });

  socket.on("answer", ({ sdp, to, room }) => {
    if (!to || !sdp) return;
    console.log(`📡 Answer from ${socket.id} to ${to} in room ${room}`);
    io.to(to).emit("answer", { sdp, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, room }) => {
    if (!room || !candidate) return;
    console.log(`📡 ICE candidate from ${socket.id} in room ${room}`);
    socket.to(room).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Leave room
  socket.on("leaveRoom", (room) => {
    try {
      socket.leave(room);
      console.log(`${socket.id} left room ${room}`);
    } catch {}
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// --------------------
// Export server
// --------------------
module.exports = server;
