import { useEffect, useState } from "react";

import RoomList from "./RoomList";
import OnlineUsers from "./OnlineUsers";
import ProfileMenu from "./ProfileMenu";
import UpdatePhotoModal from "./UpdatePhotoModal";
import AboutStatusModal from "./AboutStatusModal";
import SettingsModal from "./SettingsModal";

import { getMyProfile } from "../services/userService";

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
    // activeModal: "photo" | "about" | "settings" | null

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

    const getInitials = (name) => {
        if (!name) {
            return "?";
        }
        return name
            .trim()
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    const chats = rooms.filter((room) => room.roomType === "CHAT");
    const groups = rooms.filter((room) => room.roomType === "GROUP");
    const channels = rooms.filter((room) => room.roomType === "CHANNEL");

    const selectedRoomData = rooms.find(
        (room) => room.roomCode === selectedRoom
    );

    return (
        <div
            className={`${
                selectedRoom ? "hidden md:flex" : "flex"
            } w-full md:w-80 bg-white dark:bg-stone-900 border-r dark:border-stone-700 flex-col`}
        >
            <div className="p-4 border-b dark:border-stone-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-md shadow-teal-200 dark:shadow-none">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-400 dark:to-cyan-300 bg-clip-text text-transparent tracking-tight leading-none">
                            Samvaad
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-stone-400">
                            Dil se dil tak 💙
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 relative">
                    {/* AVATAR + NAME — click to view profile */}
                    <button
                        onClick={() => setActiveModal("settings")}
                        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-stone-800 rounded-full pl-1 pr-2 py-1 transition-colors"
                    >
                        {profile?.profileImageBase64 ? (
                            <img
                                src={profile.profileImageBase64}
                                alt="Profile"
                                className="w-9 h-9 rounded-full object-cover border dark:border-stone-600"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                {getInitials(profile?.fullName)}
                            </div>
                        )}

                        <span className="text-sm font-medium max-w-[90px] truncate text-gray-900 dark:text-stone-100">
                            {profile?.fullName || "..."}
                        </span>
                    </button>

                    {/* KEBAB MENU BUTTON */}
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpen((open) => !open);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors"
                        aria-label="Profile menu"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-gray-500 dark:text-stone-400"
                        >
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>

                    {menuOpen && (
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
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <RoomList
                    title="💬 Chats"
                    rooms={chats}
                    selectedRoom={selectedRoom}
                    onSelectRoom={onSelectRoom}
                    onNewChat={onNewChat}
                    onRoomCreated={onRoomCreated}
                />

                <div className="my-5 border-t dark:border-stone-700"></div>

                <RoomList
                    title="👥 Groups"
                    rooms={groups}
                    selectedRoom={selectedRoom}
                    onSelectRoom={onSelectRoom}
                    onRoomCreated={onRoomCreated}
                />

                <div className="my-5 border-t dark:border-stone-700"></div>

                <RoomList
                    title="📢 Channels"
                    rooms={channels}
                    selectedRoom={selectedRoom}
                    onSelectRoom={onSelectRoom}
                    onRoomCreated={onRoomCreated}
                />

                <div className="my-5 border-t dark:border-stone-700"></div>

                <OnlineUsers
                    users={onlineUsers}
                    currentUserEmail={currentUserEmail}
                    selectedRoomUserEmail={selectedRoomData?.otherUserEmail}
                />
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
        </div>
    );
}