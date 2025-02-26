import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./chatroom.css";

const socket = io("http://localhost:4000");

const ChatRoomsList = ({ onJoinRoom }) => {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState("");

    useEffect(() => {
        socket.on("roomList", (updatedRooms) => {
            setRooms(updatedRooms);
        });

        // Request rooms when the component mounts
        socket.emit("requestRooms");

        return () => {
            socket.off("roomList");
        };
    }, []);

    const createRoom = () => {
        if (newRoom.trim()) {
            socket.emit("createRoom", newRoom);
            setNewRoom("");
        }
    };

    return (
        <div className="body1">
            <div className="Available">
                <h2 >Available Chat Rooms</h2>
            </div>
            <div className="Rooms">
                <ul>
                    {rooms.map((room) => (
                        <li key={room} className="Join">
                            <button onClick={() => onJoinRoom(room)}>Join {room}</button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="Input">
                <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="Enter room name"
                />
                <button onClick={createRoom}>Create Room</button>`

            </div>
        </div>
    );
};

export default ChatRoomsList;