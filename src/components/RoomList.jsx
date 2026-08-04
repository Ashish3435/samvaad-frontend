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
                    <h3 className="font-bold text-lg text-gray-900 dark:text-stone-100">
                        {title}
                    </h3>

                    {isChats && (
                        <button
                            onClick={onNewChat}
                            className="text-blue-600 dark:text-teal-400 text-2xl font-bold cursor-pointer hover:text-blue-800 dark:hover:text-teal-300"
                        >
                            +
                        </button>
                    )}

                    {isGroups && (
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="text-blue-600 dark:text-teal-400 text-2xl font-bold cursor-pointer hover:text-blue-800 dark:hover:text-teal-300"
                        >
                            +
                        </button>
                    )}

                    {isChannels && (
                        <button
                            onClick={() => setShowChannelModal(true)}
                            className="text-blue-600 dark:text-teal-400 text-2xl font-bold cursor-pointer hover:text-blue-800 dark:hover:text-teal-300"
                        >
                            +
                        </button>
                    )}

                </div>

                {rooms.length === 0 ? (

                    <p className="text-gray-400 dark:text-stone-500">
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
                                flex
                                items-center
                                justify-between
                                gap-2
                                ${
                                selectedRoom === room.roomCode
                                    ? "bg-[#993556] text-white"
                                    : "border dark:border-stone-700 text-gray-900 dark:text-stone-100 hover:bg-blue-50 dark:hover:bg-stone-800"
                            }
                            `}
                        >
                            <span className="truncate">
                                {
                                    room.roomType === "CHAT"
                                        ? (room.otherUserName || room.roomName)
                                        : room.roomName
                                }
                            </span>

                            {room.unreadCount > 0 && (
                                <span
                                    className={`shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${
                                        selectedRoom === room.roomCode
                                            ? "bg-white text-[#993556]"
                                            : "bg-[#993556] text-white"
                                    }`}
                                >
                                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                                </span>
                            )}
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