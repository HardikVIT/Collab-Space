import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";



const SOCKET_URL = "https://collab-space-chatroom.vercel.app";

export default function ChatRoom({ room, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);   // Sharer's preview
  const remoteVideoRef = useRef(null);  // Viewer's video
  const screenStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ---------- helpers ----------
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const ensurePC = () => {
    if (pcRef.current && pcRef.current.connectionState !== "closed") return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", { candidate: event.candidate, room });
      }
    };

    pc.ontrack = (event) => {
      // The first stream contains the screen
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        const v = remoteVideoRef.current;
        v.onloadedmetadata = () => v.play().catch(() => {});
      }
    };

    // Renegotiate when track set changes
    pc.onnegotiationneeded = async () => {
      try {
        // Only the sharer should initiate negotiation
        if (isHost) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit("offer", { sdp: offer, room });
        }
      } catch (e) {
        console.error("negotiationneeded error", e);
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // ---------- socket init ----------
  useEffect(() => {
    // single stable socket
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
      });
    }
    const socket = socketRef.current;

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const handleHistory = (history) => setMessages(history);

    socket.emit("joinRoom", room);
    socket.on("message", handleMessage);
    socket.on("chatHistory", handleHistory);

    // WebRTC signaling
    socket.on("offer", async ({ sdp, from }) => {
      // viewer path
      const pc = ensurePC();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { sdp: answer, to: from, room });
        setIsHost(false);
      } catch (err) {
        console.error("Error handling offer", err);
      }
    });

    socket.on("answer", async ({ sdp }) => {
      const pc = ensurePC();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error("Error setting remote answer", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        const pc = ensurePC();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    socket.on("stop-share", () => {
      // Remote stopped: clear remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    return () => {
      // cleanup
      socket.emit("leaveRoom", room);
      socket.off("message", handleMessage);
      socket.off("chatHistory", handleHistory);
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("stop-share");
    };
  }, [room]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(scrollToBottom, [messages]);

  // ---------- chat ----------
  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    // optimistic add (snappy)
    const optimistic = { sender: "You", text, timestamp: new Date().toISOString(), optimistic: true };
    setMessages((prev) => [...prev, optimistic]);
    socketRef.current?.emit("chatMessage", { room, message: text });
    setMessage("");
  };

  // ---------- screen share ----------
  const startScreenShare = async () => {
    try {
      const pc = ensurePC();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30, width: { max: 1920 }, height: { max: 1080 } },
        audio: false,
      });

      // keep reference for stop
      screenStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        const v = localVideoRef.current;
        v.onloadedmetadata = () => v.play().catch(() => {});
      }

      // replace existing senders if any
      const videoTrack = stream.getVideoTracks()[0];
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(videoTrack);
      } else {
        pc.addTrack(videoTrack, stream);
      }

      setIsHost(true);
      setIsSharing(true);

      // initial offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("offer", { sdp: offer, room });

      // stop when user stops sharing via browser UI
      videoTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.error("startScreenShare error", err);
      setIsHost(false);
      setIsSharing(false);
    }
  };

  const stopScreenShare = async () => {
    try {
      const pc = pcRef.current;
      setIsSharing(false);
      setIsHost(false);

      // stop local stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null;

      // remove video sender
      if (pc) {
        pc.getSenders()
          .filter((s) => s.track && s.track.kind === "video")
          .forEach((s) => pc.removeTrack(s));
      }

      socketRef.current?.emit("stop-share", { room });
    } catch (e) {
      console.error("stopScreenShare error", e);
    }
  };

  // ---------- UI ----------
  return (
    <div className="chatroom-root">
      <div className="chat-room-title">
        <h2>Room: {room}</h2>
        <button className="leave-room-btn" onClick={onLeave}>Leave Room</button>
      </div>

      <div className="chat-box" style={{ maxHeight: 260, overflowY: "auto", padding: 8 }}>
        {messages.map((msg, idx) => (
          <div key={idx} className="message-row">
            <strong>{msg.sender === "You" || msg.sender === socketRef.current?.id ? "You" : msg.sender}:</strong>{" "}
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
        />
        <div className="send-message">
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Screen Share</h3>
        {!isSharing ? (
          <button onClick={startScreenShare}>Start Screen Share</button>
        ) : (
          <button onClick={stopScreenShare}>Stop Screen Share</button>
        )}

        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Your Screen</div>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: 320, border: "1px solid #ccc", borderRadius: 8 }}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Remote</div>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: 560, border: "1px solid #ccc", borderRadius: 8 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
