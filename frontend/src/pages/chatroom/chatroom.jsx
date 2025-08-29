import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";

const socket = io("https://collab-space-chatroom.vercel.app");
const ChatRoom = ({ room, onLeave }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [stream, setStream] = useState(null);

    const videoRef = useRef(null);        // local screen
    const remoteRef = useRef(null);  // remote shared screen

    useEffect(() => {
        // join room
        socket.emit("joinRoom", room);
        // incoming chat messages
        socket.on("message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on("chatHistory", (history) => {
            setMessages(history);
        });

        // receive remote screen frames
        socket.on("SS", ({ screenData }) => {
            if (remoteRef.current) {
            remoteRef.current.src = screenData; // update image each frame
            }
        });

        return () => {
            socket.emit("leaveRoom", room);
            socket.off("message");
            socket.off("chatHistory");
            socket.off("SS");
        };
    }, [room]);

    // start screen sharing
    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = screenStream; // local preview
            }

            const track = screenStream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);

            const sendFrame = async () => {
            if (track.readyState === "ended") return;

            try {
                const bitmap = await imageCapture.grabFrame();
                const canvas = document.createElement("canvas");
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(bitmap, 0, 0);
                const base64 = canvas.toDataURL("image/webp", 0.4);

                socket.emit("screenShare", { room, screenData: base64 });
            } catch (err) {
                console.error("Frame capture error:", err);
            }

            requestAnimationFrame(sendFrame);
            };

            sendFrame();
        } catch (err) {
            console.error("Error sharing screen:", err);
        }
    };


    const sendMessage = () => {
        if (message.trim()) {
            socket.emit("chatMessage", { room, message });
            setMessage("");
        }
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
                        <strong>{msg.sender === socket.id ? "You" : msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>

            <div className="remote-screen">
                <h2>Shared Screen</h2>
                <img ref={remoteRef} alt="Remote Screen" className="remote-video" />
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
