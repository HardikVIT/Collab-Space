const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow frontend
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://aarshjain2022:aarshjain@cluster0.grnmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Room Schema
const RoomSchema = new mongoose.Schema({ name: String });
const Room = mongoose.model("Room", RoomSchema);

// Message Schema
const MessageSchema = new mongoose.Schema({
    room: String,
    sender: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    // Send available chat rooms from MongoDB
    const rooms = await Room.find();
    socket.emit("roomList", rooms.map(room => room.name));

    // Create a chat room (store in MongoDB)
    socket.on("createRoom", async (roomName) => {
        const existingRoom = await Room.findOne({ name: roomName });
        if (!existingRoom) {
            await new Room({ name: roomName }).save();
            io.emit("roomList", (await Room.find()).map(room => room.name)); // Update for all users
        }
    });

    // Join a room
    socket.on("joinRoom", async (room) => {
        socket.join(room);
        socket.emit("message", { sender: "System", text: `You joined ${room}`, timestamp: new Date() });

        // Fetch and send chat history from MongoDB
        const chatHistory = await Message.find({ room }).sort({ timestamp: 1 });
        socket.emit("chatHistory", chatHistory);
    });

    // Send a message
    socket.on("chatMessage", async ({ room, message }) => {
        const msg = { sender: socket.id, text: message, timestamp: new Date() };

        // Emit immediately
        io.to(room).emit("message", msg);

        // Save to MongoDB
        await new Message({ room, sender: socket.id, text: message }).save();
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Start server
server.listen(4000, () => console.log("Server running on port 4000"));
