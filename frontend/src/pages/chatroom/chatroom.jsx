import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";

const socket = io("https://collab-space-chatroom.vercel.app");

const ChatRoom = ({ room, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const chatBoxRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Particle effect for new messages
  const createParticle = () => {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = window.innerHeight + 'px';
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    const particles = document.querySelector('.particles') || document.body;
    particles.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 4000);
  };

  // -------------------------------
  // Chat handling
  // -------------------------------
  useEffect(() => {
    socket.emit("joinRoom", room);

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      createParticle(); // Add particle effect for new messages
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatBoxRef.current) {
          chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
      }, 100);
    });

    socket.on("chatHistory", (history) => {
      setMessages(history);
    });

    socket.on("every", (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    socket.on("userCount", (count) => {
      setOnlineUsers(count);
    });

    socket.on("connect", () => {
      setConnectionStatus('connected');
    });

    socket.on("disconnect", () => {
      setConnectionStatus('disconnected');
    });

    socket.on("reconnect", () => {
      setConnectionStatus('connected');
    });

    return () => {
      socket.emit("leaveRoom", room);
      socket.off("message");
      socket.off("chatHistory");
      socket.off("every");
      socket.off("userCount");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("reconnect");
    };
  }, [room]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Typing indicator logic
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { room, typing: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { room, typing: false });
    }, 1000);
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { room, message });
      setMessage("");
      setIsTyping(false);
      socket.emit("typing", { room, typing: false });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // -------------------------------
  // Screen share handling
  // -------------------------------
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit("startShare", room, stream);
      
      // Add success feedback
      const button = document.querySelector('.screen-share-btn');
      if (button) {
        button.textContent = 'Sharing Screen...';
        button.style.background = 'var(--success-green)';
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
      // Add error feedback
      const button = document.querySelector('.screen-share-btn');
      if (button) {
        button.textContent = 'Screen Share Failed';
        button.style.background = 'var(--warning-orange)';
        setTimeout(() => {
          button.textContent = 'Start Screen Share';
          button.style.background = '';
        }, 2000);
      }
    }
  };

  // -------------------------------
  // Render UI
  // -------------------------------
  return (
    <div className="body1">
      {/* Particle container */}
      <div className="particles"></div>
      
      {/* Connection Status */}
      <div className={`connection-status ${connectionStatus}`}>
        <div className="status-indicator"></div>
        {connectionStatus === 'connected' ? 'Connected' : 'Reconnecting...'}
        {onlineUsers > 0 && <span className="user-count">• {onlineUsers} online</span>}
      </div>

      {/* Chat Room Title */}
      <div className="chat-room-title glass-container">
        <h2>🚀 Room: {room}</h2>
      </div>

      {/* Main Content Area - Grid Layout */}
      <div className="chat-room-container">
        {/* Left Column - Screen Share/Remote Video */}
        <div className="remote-video glass-container">
          <div className="video-header">
            <h3>🖥️ Screen Share</h3>
            <button 
              className="screen-share-btn" 
              onClick={startScreenShare}
              style={{ 
                padding: '8px 16px', 
                fontSize: '14px',
                borderRadius: '20px',
                marginLeft: 'auto'
              }}
            >
              Start Screen Share
            </button>
          </div>
          <div className="video-container">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
              style={{ 
                width: '150px', 
                height: '100px',
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                zIndex: 10
              }}
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video-main"
              style={{ 
                width: '100%', 
                height: '400px',
                objectFit: 'cover',
                backgroundColor: '#1a1a1a',
                borderRadius: '10px'
              }}
            />
          </div>
        </div>

        {/* Right Column - Chat Box */}
        <div className="chat-box glass-container">
          <div className="chat-header">
            <h3>💬 Chat</h3>
            <div className="chat-controls">
              {isTyping && <div className="typing-indicator">Someone is typing...</div>}
            </div>
          </div>
          <div className="messages-container" ref={chatBoxRef}>
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>No messages yet. Start the conversation! 👋</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`stronger ${msg.sender === socket.id ? 'own-message' : 'other-message'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <strong>{msg.sender === socket.id ? "You" : msg.sender}:</strong>
                  <span className="message-text">{msg.text}</span>
                  <div className="message-time">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer with Leave Button and Chat Input */}
      <div className="chat-room-footer">
        <button className="leave-room-btn" onClick={onLeave}>
          ← Leave Room
        </button>

        <div className="chat-input-container glass-container">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="chat-input"
          />
          <div className="send-message">
            <button 
              onClick={sendMessage}
              disabled={!message.trim()}
              className="send-btn"
            >
              Send 🚀
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .connection-status {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 8px 16px;
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          color: var(--text-primary);
          font-size: 14px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success-green);
          animation: pulse 2s infinite;
        }

        .connection-status.disconnected .status-indicator {
          background: var(--warning-orange);
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .user-count {
          color: var(--text-secondary);
        }

        .video-header, .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--glass-border);
        }

        .video-header h3, .chat-header h3 {
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .video-container {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
        }

        .messages-container {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .empty-chat {
          text-align: center;
          color: var(--text-secondary);
          font-style: italic;
          padding: 40px 20px;
        }

        .own-message {
          margin-left: 20px;
        }

        .own-message strong {
          background: var(--accent-blue);
        }

        .other-message {
          margin-right: 20px;
        }

        .other-message strong {
          background: var(--accent-purple);
        }

        .message-text {
          margin-left: 10px;
          color: var(--text-primary);
        }

        .message-time {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 5px;
        }

        .typing-indicator {
          font-size: 12px;
          color: var(--text-secondary);
          font-style: italic;
        }

        .chat-input {
          flex: 1;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .send-btn:disabled:hover {
          transform: none;
          box-shadow: var(--shadow-primary);
        }
      `}</style>
    </div>
  );
};

export default ChatRoom;