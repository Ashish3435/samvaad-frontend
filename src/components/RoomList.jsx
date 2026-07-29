import { useState } from "react";

import CreateGroupModal from "./CreateGroupModal";
import CreateChannelModal from "./CreateChannelModal";

import { createRoom } from "../services/roomService";

export default function RoomList({
                                     title,
                                     rooms,
                                     selectedRoom,
                                     onSelectRoom,
                                     onNewChat,
                                     onRoomCreated,
                                 }) {

    const [showGroupModal, setShowGroupModal] =
        useState(false);

    const [showChannelModal, setShowChannelModal] =
        useState(false);

    const isChats = title?.includes("Chats");
    const isGroups = title?.includes("Groups");
    const isChannels = title?.includes("Channels");

    const createGroup = async (roomName) => {

        try {

            if (!roomName.trim()) {
                return;
            }

            const newRoom = await createRoom(
                roomName,
                "GROUP"
            );

            setShowGroupModal(false);

            if (onRoomCreated) {
                onRoomCreated(newRoom);
            }

        } catch (error) {

            console.error(
                "CREATE GROUP ERROR :",
                error
            );

        }

    };

    const createChannel = async (roomName) => {

        try {

            if (!roomName.trim()) {
                return;
            }

            const newRoom = await createRoom(
                roomName,
                "CHANNEL"
            );

            setShowChannelModal(false);

            if (onRoomCreated) {
                onRoomCreated(newRoom);
            }

        } catch (error) {

            console.error(
                "CREATE CHANNEL ERROR :",
                error
            );

        }

    };

    return (

        <>

            <div className="mb-6">

                <div className="flex justify-between items-center mb-3">

                    <h3 className="font-bold text-lg">
                        {title}
                    </h3>

                    {isChats && (
                        <button
                            onClick={onNewChat}
                            className="text-blue-600 text-2xl font-bold cursor-pointer hover:text-blue-800"
                        >
                            +
                        </button>
                    )}

                    {isGroups && (
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="text-blue-600 text-2xl font-bold cursor-pointer hover:text-blue-800"
                        >
                            +
                        </button>
                    )}

                    {isChannels && (
                        <button
                            onClick={() => setShowChannelModal(true)}
                            className="text-blue-600 text-2xl font-bold cursor-pointer hover:text-blue-800"
                        >
                            +
                        </button>
                    )}

                </div>

                {rooms.length === 0 ? (

                    <p className="text-gray-400">
                        No rooms
                    </p>

                ) : (

                    rooms.map((room) => (

                        <div
                            key={room.roomCode}
                            onClick={() =>
                                onSelectRoom(room.roomCode)
                            }
                            className={`
                                p-3
                                rounded-lg
                                cursor-pointer
                                mb-2
                                transition
                                truncate
                                ${
                                selectedRoom === room.roomCode
                                    ? "bg-blue-600 text-white"
                                    : "border hover:bg-blue-50"
                            }
                            `}
                        >

                            {
                                room.roomType === "CHAT"
                                    ? (room.otherUserName || room.roomName)
                                    : room.roomName
                            }

                        </div>

                    ))

                )}

            </div>

            {showGroupModal && (

                <CreateGroupModal
                    onClose={() =>
                        setShowGroupModal(false)
                    }
                    onCreate={createGroup}
                />

            )}

            {showChannelModal && (

                <CreateChannelModal
                    onClose={() =>
                        setShowChannelModal(false)
                    }
                    onCreate={createChannel}
                />

            )}

        </>

    );

}