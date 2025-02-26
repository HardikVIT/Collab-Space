import React, { useState } from "react";
import ChatRoomsList from "./chatroomlist";
import ChatRoom from "./chatroom";
import "./chatroom.css";

const MainChat = () => {
    const [currentRoom, setCurrentRoom] = useState(null);

    return (
        
        <div className="body1">
            {currentRoom ? (
                <ChatRoom room={currentRoom} onLeave={() => setCurrentRoom(null)} />
            ) : (
                <ChatRoomsList onJoinRoom={setCurrentRoom} />
            )}
        </div>

    );
};

export default MainChat;