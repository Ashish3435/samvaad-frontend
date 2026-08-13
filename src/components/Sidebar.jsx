import { useEffect, useState } from "react";

import IconRail from "./IconRail";
import OnlineUsers from "./OnlineUsers";
import ProfileMenu from "./ProfileMenu";
import UpdatePhotoModal from "./UpdatePhotoModal";
import AboutStatusModal from "./AboutStatusModal";
import SettingsModal from "./SettingsModal";
import CreateGroupModal from "./CreateGroupModal";
import CreateChannelModal from "./CreateChannelModal";

import { getMyProfile } from "../services/userService";
import { createRoom } from "../services/roomService";

const CATEGORY_LABELS = {
    CHAT: "Chats",
    GROUP: "Groups",
    CHANNEL: "Channels"
};

export default function Sidebar({
                                    rooms = [],
                                    selectedRoom,
                                    onSelectRoom,
                                    onlineUsers = [],
                                    onLogout,
                                    onRoomCreated,
                                    onNewChat,
                                    currentUserEmail
                                }) {
    const [profile, setProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [activeCategory, setActiveCategory] = useState("CHAT");
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showChannelModal, setShowChannelModal] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getMyProfile();
            setProfile(data);
        } catch (error) {
            console.error("PROFILE LOAD ERROR:", error);
        }
    };

    const chats = rooms.filter(
        (room) => room.roomType === "CHAT"
    );

    const groups = rooms.filter(
        (room) => room.roomType === "GROUP"
    );

    const channels = rooms.filter(
        (room) => room.roomType === "CHANNEL"
    );

    const categoryRooms =
        activeCategory === "CHAT"
            ? chats
            : activeCategory === "GROUP"
                ? groups
                : channels;

    const hasUnread = {
        CHAT: chats.some((room) => room.unreadCount > 0),
        GROUP: groups.some((room) => room.unreadCount > 0),
        CHANNEL: channels.some((room) => room.unreadCount > 0)
    };

    const selectedRoomData = rooms.find(
        (room) => room.roomCode === selectedRoom
    );

    const createGroup = async (roomName) => {
        try {
            if (!roomName.trim()) return;

            const newRoom = await createRoom(
                roomName,
                "GROUP"
            );

            setShowGroupModal(false);

            if (onRoomCreated) {
                onRoomCreated(newRoom);
            }
        } catch (error) {
            console.error("CREATE GROUP ERROR:", error);
        }
    };

    const createChannel = async (roomName) => {
        try {
            if (!roomName.trim()) return;

            const newRoom = await createRoom(
                roomName,
                "CHANNEL"
            );

            setShowChannelModal(false);

            if (onRoomCreated) {
                onRoomCreated(newRoom);
            }
        } catch (error) {
            console.error("CREATE CHANNEL ERROR:", error);
        }
    };

    const handleAddClick = () => {
        if (activeCategory === "CHAT") {
            onNewChat();
        } else if (activeCategory === "GROUP") {
            setShowGroupModal(true);
        } else {
            setShowChannelModal(true);
        }
    };

    return (
        <>
            <div
                className={`${
                    selectedRoom
                        ? "hidden md:flex"
                        : "flex"
                } w-full md:w-[360px] lg:w-[380px] shrink-0 h-full min-h-0 bg-white dark:bg-stone-900`}
            >
                <div className="w-full h-full min-h-0 flex flex-col">

                    <div className="h-[104px] shrink-0 flex items-center px-5 border-b dark:border-stone-700 bg-white dark:bg-stone-900">
                        <img
                            src="/icon-192.png"
                            alt="Samvaad"
                            className="w-14 h-14 rounded-2xl shrink-0"
                        />

                        <div className="ml-3 min-w-0">
                            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-400 dark:to-cyan-300 bg-clip-text text-transparent leading-tight">
                                Samvaad
                            </h1>

                            <p className="text-sm text-gray-400 dark:text-stone-400 mt-1 truncate">
                                Where conversations feel like home
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-1 min-h-0">

                        <IconRail
                            activeCategory={activeCategory}
                            onCategoryChange={setActiveCategory}
                            hasUnread={hasUnread}
                            profile={profile}
                            onOpenProfileMenu={() =>
                                setMenuOpen((open) => !open)
                            }
                            menuOpen={menuOpen}
                            profileMenuNode={
                                <ProfileMenu
                                    onClose={() => setMenuOpen(false)}
                                    onSettings={() => {
                                        setActiveModal("settings");
                                        setMenuOpen(false);
                                    }}
                                    onUpdatePhoto={() => {
                                        setActiveModal("photo");
                                        setMenuOpen(false);
                                    }}
                                    onAboutStatus={() => {
                                        setActiveModal("about");
                                        setMenuOpen(false);
                                    }}
                                    onLogout={onLogout}
                                />
                            }
                        />

                        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-stone-900">

                            <div className="h-[58px] shrink-0 px-5 border-b dark:border-stone-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-stone-100">
                                    {CATEGORY_LABELS[activeCategory]}
                                </h2>

                                <button
                                    onClick={handleAddClick}
                                    className="text-blue-600 dark:text-teal-400 text-2xl font-bold hover:text-blue-800 dark:hover:text-teal-300"
                                >
                                    +
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">

                                {categoryRooms.length === 0 ? (
                                    <p className="text-gray-400 dark:text-stone-500">
                                        No rooms
                                    </p>
                                ) : (
                                    categoryRooms.map((room) => (
                                        <div
                                            key={room.roomCode}
                                            onClick={() =>
                                                onSelectRoom(room.roomCode)
                                            }
                                            className={`p-3 rounded-lg cursor-pointer mb-2 transition flex items-center justify-between gap-2 ${
                                                selectedRoom === room.roomCode
                                                    ? "bg-[#993556] text-white"
                                                    : "border dark:border-stone-700 text-gray-900 dark:text-stone-100 hover:bg-blue-50 dark:hover:bg-stone-800"
                                            }`}
                                        >
                                            <span className="truncate">
                                                {room.roomType === "CHAT"
                                                    ? (
                                                        room.otherUserName ||
                                                        room.roomName
                                                    )
                                                    : room.roomName}
                                            </span>

                                            {room.unreadCount > 0 && (
                                                <span
                                                    className={`shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${
                                                        selectedRoom === room.roomCode
                                                            ? "bg-white text-[#993556]"
                                                            : "bg-[#993556] text-white"
                                                    }`}
                                                >
                                                    {room.unreadCount > 99
                                                        ? "99+"
                                                        : room.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}

                                {activeCategory === "CHAT" && (
                                    <>
                                        <div className="my-5 border-t dark:border-stone-700" />

                                        <OnlineUsers
                                            users={onlineUsers}
                                            currentUserEmail={currentUserEmail}
                                            selectedRoomUserEmail={
                                                selectedRoomData?.otherUserEmail
                                            }
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {activeModal === "photo" && (
                <UpdatePhotoModal
                    currentPhoto={profile?.profileImageBase64}
                    onClose={() => setActiveModal(null)}
                    onUpdated={(updatedProfile) => {
                        setProfile(updatedProfile);
                        setActiveModal(null);
                    }}
                />
            )}

            {activeModal === "about" && (
                <AboutStatusModal
                    currentStatus={profile?.aboutStatus}
                    onClose={() => setActiveModal(null)}
                    onUpdated={(updatedProfile) => {
                        setProfile(updatedProfile);
                        setActiveModal(null);
                    }}
                />
            )}

            {activeModal === "settings" && (
                <SettingsModal
                    profile={profile}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {showGroupModal && (
                <CreateGroupModal
                    onClose={() => setShowGroupModal(false)}
                    onCreate={createGroup}
                />
            )}

            {showChannelModal && (
                <CreateChannelModal
                    onClose={() => setShowChannelModal(false)}
                    onCreate={createChannel}
                />
            )}
        </>
    );
}