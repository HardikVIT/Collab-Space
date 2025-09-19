import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";

const socket = io("https://collab-space-chatroom.vercel.app");

const ChatRoomsList = ({ onJoinRoom }) => {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [totalUsers, setTotalUsers] = useState(0);

    useEffect(() => {
        // Connection status handlers
        socket.on("connect", () => {
            setConnectionStatus('connected');
            setIsLoading(false);
        });

        socket.on("disconnect", () => {
            setConnectionStatus('disconnected');
        });

        socket.on("roomList", (updatedRooms) => {
            setRooms(updatedRooms);
            setIsLoading(false);
            
            // Add entrance animation to room items
            setTimeout(() => {
                const roomItems = document.querySelectorAll('.room-item');
                roomItems.forEach((item, index) => {
                    item.style.setProperty('--item-index', index);
                });
            }, 100);
        });

        socket.on("totalUsers", (count) => {
            setTotalUsers(count);
        });

        // Request rooms when the component mounts
        socket.emit("requestRooms");

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("roomList");
            socket.off("totalUsers");
        };
    }, []);

    const createRoom = () => {
        if (newRoom.trim()) {
            socket.emit("createRoom", newRoom);
            setNewRoom("");
            
            // Add success feedback
            const button = document.querySelector('.create-room-btn');
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Room Created! ✨';
                button.style.background = 'var(--success-green)';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 2000);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            createRoom();
        }
    };

    const handleRoomJoin = (roomName) => {
        // Add click effect
        const clickedButton = document.querySelector(`button[data-room="${roomName}"]`);
        if (clickedButton) {
            clickedButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                clickedButton.style.transform = '';
            }, 150);
        }
        
        setTimeout(() => {
            onJoinRoom(roomName);
        }, 200);
    };

    return (
        <div className="body1 rooms-page">
            {/* Chat Room Title - Centered at top */}
            <div className="chat-room-title glass-container">
                <h2>🌟 CollabSpace Chat Rooms</h2>
            </div>

            {/* Available Rooms Header - Below title */}
            <div className="Available glass-container">
                <h2>Available Chat Rooms</h2>
                {isLoading && (
                    <div className="loading-container">
                        <div className="loading"></div>
                        <span>Loading rooms...</span>
                    </div>
                )}
            </div>

            {/* Left Side - Chat Selection Info */}
            <div className="chat-selection glass-container">
                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-number">{rooms.length}</span>
                        <span className="stat-label">Active Rooms</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{totalUsers}</span>
                        <span className="stat-label">Users Online</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <div className={`status-indicator ${connectionStatus}`}></div>
                        <span className="stat-label">{connectionStatus}</span>
                    </div>
                </div>
                
                {!isLoading && rooms.length === 0 && (
                    <div className="empty-rooms">
                        <div className="empty-icon">🏠</div>
                        <h3>No rooms available</h3>
                        <p>Be the first to create a room and start chatting!</p>
                    </div>
                )}
            </div>

            {/* Right Side - Rooms List */}
            <div className="Rooms glass-container">
                <ul className="rooms-list">
                    {rooms.map((room, index) => (
                        <li key={room} className="room-item" style={{ '--item-index': index }}>
                            <button 
                                onClick={() => handleRoomJoin(room)}
                                data-room={room}
                                className="room-button"
                            >
                                <div className="room-info">
                                    <span className="room-name">🚀 {room}</span>
                                    <span className="room-description">Click to join and start collaborating</span>
                                </div>
                                <div className="join-arrow">→</div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Bottom - Input Section */}
            <div className="Input glass-container">
                <div className="input-header">
                    <h3>✨ Create New Room</h3>
                    <p>Start a new conversation space</p>
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter a unique room name..."
                        className="room-input"
                    />
                    <button 
                        onClick={createRoom}
                        className="create-room-btn"
                        disabled={!newRoom.trim()}
                    >
                        Create Room ✨
                    </button>
                </div>
            </div>

            <style jsx>{`
                .hero-stats {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 30px;
                    margin: 30px 0;
                    flex-wrap: wrap;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }

                .stat-number {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--accent-blue);
                }

                .stat-label {
                    font-size: 14px;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .stat-divider {
                    width: 1px;
                    height: 40px;
                    background: var(--glass-border);
                }

                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-bottom: 5px;
                }

                .status-indicator.connected {
                    background: var(--success-green);
                    animation: pulse 2s infinite;
                }

                .status-indicator.connecting {
                    background: var(--warning-orange);
                    animation: pulse 2s infinite;
                }

                .status-indicator.disconnected {
                    background: #e74c3c;
                }

                .loading-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: var(--text-secondary);
                    margin-top: 20px;
                }

                .empty-rooms {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-secondary);
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }

                .empty-rooms h3 {
                    color: var(--text-primary);
                    margin-bottom: 10px;
                    font-size: 20px;
                }

                .rooms-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .room-item {
                    animation-delay: calc(var(--item-index, 0) * 0.1s);
                }

                .room-button {
                    width: 100%;
                    padding: 20px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: 15px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }

                .room-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: var(--primary-gradient);
                    opacity: 0.1;
                    transition: left 0.5s ease;
                }

                .room-button:hover::before {
                    left: 0;
                }

                .room-button:hover {
                    transform: translateY(-5px) scale(1.02);
                    border-color: var(--accent-blue);
                    box-shadow: var(--shadow-hover);
                }

                .room-info {
                    text-align: left;
                }

                .room-name {
                    display: block;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 5px;
                }

                .room-description {
                    font-size: 14px;
                    color: var(--text-secondary);
                }

                .join-arrow {
                    font-size: 24px;
                    color: var(--accent-blue);
                    transition: transform 0.3s ease;
                }

                .room-button:hover .join-arrow {
                    transform: translateX(5px);
                }

                .input-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .input-header h3 {
                    color: var(--text-primary);
                    font-size: 24px;
                    margin-bottom: 10px;
                }

                .input-header p {
                    color: var(--text-secondary);
                    font-size: 16px;
                }

                .input-group {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .room-input {
                    flex: 1;
                    min-width: 250px;
                }

                .create-room-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .create-room-btn:disabled:hover {
                    transform: none;
                    box-shadow: var(--shadow-primary);
                }

                @media (max-width: 768px) {
                    .hero-stats {
                        gap: 20px;
                    }
                    
                    .stat-divider {
                        display: none;
                    }
                    
                    .input-group {
                        flex-direction: column;
                    }
                    
                    .room-input {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default ChatRoomsList;