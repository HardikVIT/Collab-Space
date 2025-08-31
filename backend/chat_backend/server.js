
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ===== IMPORTANT: move this URI to an environment variable in production =====
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://aarshjain2022:aarshjain@cluster0.grnmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Schemas & Indexes
const RoomSchema = new mongoose.Schema({ name: { type: String, unique: true, index: true } });
const Room = mongoose.model("Room", RoomSchema);

const MessageSchema = new mongoose.Schema({
  room: { type: String, index: true },
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now, index: true }
});
MessageSchema.index({ room: 1, timestamp: 1 });
const Message = mongoose.model("Message", MessageSchema);

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  // Preload rooms (optional)
  try {
    const rooms = await Room.find().lean();
    socket.emit("roomList", rooms.map(r => r.name));
  } catch (e) {
    console.error("roomList error", e);
  }

  socket.on("createRoom", async (roomName) => {
    try {
      const existing = await Room.findOne({ name: roomName }).lean();
      if (!existing) {
        await new Room({ name: roomName }).save();
        const all = await Room.find().lean();
        io.emit("roomList", all.map(r => r.name));
      }
    } catch (e) {
      console.error("createRoom error", e);
    }
  });

  socket.on("joinRoom", async (room) => {
    try {
      socket.join(room);

      // Send history (last 100 messages) first for faster perceived load
      const raw = await Message.find({ room })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
      const history = raw.reverse();
      socket.emit("chatHistory", history);

      // Then system message
      socket.emit("message", { sender: "System", text: `You joined ${room}`, timestamp: new Date() });
    } catch (e) {
      console.error("joinRoom error", e);
    }
  });

  socket.on("chatMessage", async ({ room, message }) => {
    const msg = { sender: socket.id, text: message, timestamp: new Date() };
    // emit immediately
    io.to(room).emit("message", msg);
    // write behind (no await to remove UI lag; fire-and-forget)
    try {
      Message.create({ room, sender: socket.id, text: message });
    } catch (e) {
      console.error("Persist message error", e);
    }
  });

  // ===== WebRTC signaling =====
  socket.on("offer", ({ sdp, room }) => {
    if (!room) return;
    console.log(`Offer from ${socket.id} in room ${room}`);
    socket.to(room).emit("offer", { sdp, from: socket.id });
  });

  socket.on("answer", ({ sdp, to, room }) => {
    if (!to) return;
    console.log(`Answer from ${socket.id} to ${to} in room ${room}`);
    io.to(to).emit("answer", { sdp, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, room }) => {
    if (!room || !candidate) return;
    socket.to(room).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("stop-share", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("stop-share");
  });

  socket.on("leaveRoom", (room) => {
    try {
      socket.leave(room);
    } catch {}
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Export server (same API as before)
module.exports = server;
