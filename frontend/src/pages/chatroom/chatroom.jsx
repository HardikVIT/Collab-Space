import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";

const socket = io("https://collab-space-chatroom.vercel.app");

const ChatRoom = ({ room, onLeave }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        socket.emit("joinRoom", room);

        socket.on("message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on("chatHistory", (history) => {
            setMessages(history);
        });

        // Receive remote screen share
        socket.on("screenShare", ({ sender, screenData }) => {
            if (sender !== socket.id && remoteVideoRef.current) {
                remoteVideoRef.current.src = screenData; // base64 video frame
            }
        });

        return () => {
            socket.emit("leaveRoom", room);
            socket.off("message");
            socket.off("chatHistory");
            socket.off("screenShare");
        };
    }, [room]);

    const sendMessage = () => {
        if (message.trim()) {
            socket.emit("chatMessage", { room, message });
            setMessage("");
        }
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });

            setStream(screenStream);

            if (videoRef.current) {
                videoRef.current.srcObject = screenStream;
            }

            // Capture frames & emit via socket
            const track = screenStream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);

            const sendFrame = async () => {
                if (!track.readyState || track.readyState === "ended") return;

                try {
                    const bitmap = await imageCapture.grabFrame();
                    const canvas = document.createElement("canvas");
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(bitmap, 0, 0);
                    const base64 = canvas.toDataURL("image/webp", 0.3);

                    socket.emit("screenShare", { room, sender: socket.id, screenData: base64 });
                } catch (err) {
                    console.error("Frame capture error:", err);
                }

                requestAnimationFrame(sendFrame);
            };

            sendFrame();

            // Stop handler
            screenStream.getTracks().forEach(track => {
                track.onended = () => setStream(null);
            });

        } catch (err) {
            console.error("Error sharing screen:", err);
        }
    };
    socket.on("screenShare", ({ sender, screenData }) => {
        if (sender !== socket.id && remoteVideoRef.current) {
            remoteVideoRef.current.src = screenData; // base64 video frame
        }
    });

    // Receive remote screen share (broadcast event)
    socket.on("SS", ({ sender, screenData }) => {
        if (sender !== socket.id && remoteVideoRef.current) {
            remoteVideoRef.current.src = screenData;
        }
    });


    return (
        <div>
            <div className="chat-room-title">
                <h2>Room: {room}</h2>
            </div>
            <button className="leave-room-btn" onClick={onLeave}>Leave Room</button>

            <div className="chat-box">
                {messages.map((msg, index) => (
                    <div key={index} className="stronger">
                        <strong>{msg.sender === socket.id ? "You" : msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>

            {/* Screen Share Section */}
            <div className="screen-share mt-4">
                <button 
                    onClick={startScreenShare} 
                    className="p-2 bg-blue-500 text-white rounded-lg"
                >
                    Share Screen
                </button>

                {stream && (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="mt-2 w-full max-h-96 border rounded-lg shadow"
                    />
                )}

                {/* Remote shared screen */}
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="mt-2 w-full max-h-96 border-2 border-green-500 rounded-lg shadow"
                />
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
