import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";

const socket = io("https://collab-space-chatroom.vercel.app");

const ChatRoom = ({ room, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const localVideoRef = useRef(null);   // Sharer's video
  const remoteVideoRef = useRef(null);  // Viewer’s video
  const pcRef = useRef(null);

  // -------------------------------
  // Chat handling
  // -------------------------------
  useEffect(() => {
    socket.emit("joinRoom", room);

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("chatHistory", (history) => {
      setMessages(history);
    });
    socket.on("every", (stream) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
        }
    });

    return () => {
      socket.emit("leaveRoom", room);
      socket.off("message");
      socket.off("chatHistory");
      socket.off("every");
    };
  }, [room]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { room, message });
      setMessage("");
    }
  };

  const startScreenShare = () => {
    const stream =  navigator.mediaDevices.getDisplayMedia({ video: true });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    socket.emit("startShare", {room, stream});
  };
  // -------------------------------
  // Render UI
  // -------------------------------
  return (
    <div>
      <div className="chat-room-title">
        <h2>Room: {room}</h2>
      </div>
      <button className="leave-room-btn" onClick={onLeave}>Leave Room</button>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className="stronger">
            <strong>{msg.sender === socket.id ? "You" : msg.sender}:</strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>

      <div>
        <h2>Screen Share</h2>
        <button onClick={startScreenShare}>Start Screen Share</button>

        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "300px", border: "1px solid black" }}
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "600px", border: "1px solid black" }}
          />
        </div>
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <div className="send-message">
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
