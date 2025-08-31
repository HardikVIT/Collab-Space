import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";

const socket = io("https://collab-space-chatroom.vercel.app", {
  transports: ["websocket"],
});

const ChatRoom = ({ room, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const screenStreamRef = useRef(null);

  // -------------------------------
  // Chat + signaling
  // -------------------------------
  useEffect(() => {
    socket.emit("joinRoom", room);

    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("chatHistory", (history) => setMessages(history));

    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, room });
      }
    };

    pcRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Viewer receives offer
    socket.on("offer", async ({ sdp, from }) => {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("answer", { sdp: answer, to: from, room });
    });

    // Host receives answer
    socket.on("answer", async ({ sdp }) => {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // ICE candidates
    socket.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    });

    return () => {
      socket.emit("leaveRoom", room);
      socket.off("message");
      socket.off("chatHistory");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      pcRef.current.close();
    };
  }, [room]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { room, message });
      setMessage("");
    }
  };

  // -------------------------------
  // Screen share
  // -------------------------------
  const startScreenShare = async () => {
    try {
      const pc = pcRef.current;
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

      screenStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const track = stream.getVideoTracks()[0];
      pc.addTrack(track, stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { sdp: offer, room });

      // Auto-stop when user stops via browser UI
      track.onended = () => stopScreenShare();

      setIsSharing(true);
    } catch (err) {
      console.error("Error starting screen share", err);
    }
  };

  const stopScreenShare = () => {
    const pc = pcRef.current;
    setIsSharing(false);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    // Remove senders with video track
    pc.getSenders()
      .filter((s) => s.track && s.track.kind === "video")
      .forEach((s) => pc.removeTrack(s));
  };

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
        {!isSharing ? (
          <button onClick={startScreenShare}>Start Screen Share</button>
        ) : (
          <button onClick={stopScreenShare}>Stop Screen Share</button>
        )}

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
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <div className="send-message">
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
