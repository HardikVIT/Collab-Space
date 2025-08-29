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
    socket.on("offer", async (offer) => {
        if (!pcRef.current) {
            pcRef.current = new RTCPeerConnection();

            pcRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                socket.emit("iceCandidate", { room, candidate: event.candidate });
                }
            };

            // When remote track is received, play it
            pcRef.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                }
            };
        }

        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        socket.emit("answer", { room, answer });
    });

    socket.on("answer", async (answer) => {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("iceCandidate", async (candidate) => {
        try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
        console.error("Error adding ICE candidate", err);
        }
    });

    return () => {
        socket.emit("leaveRoom", room);
        socket.off("message");
        socket.off("chatHistory");
        socket.off("offer");
        socket.off("answer");
        socket.off("iceCandidate");
    };
  }, [room]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { room, message });
      setMessage("");
    }
  };

  const startScreenShare = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

    if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
    }

    // Create RTCPeerConnection if not already
    if (!pcRef.current) {
        pcRef.current = new RTCPeerConnection();
        
        // Send ICE candidates to backend
        pcRef.current.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("iceCandidate", { room, candidate: event.candidate });
        }
        };

        // Add track to connection
        stream.getTracks().forEach(track => {
        pcRef.current.addTrack(track, stream);
        });
    }

    // Create an offer
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    // Send offer to backend
    socket.emit("offer", { room, offer });
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
