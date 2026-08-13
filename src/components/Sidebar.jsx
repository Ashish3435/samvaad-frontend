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
    CHANNEL: "Channels",
};

export default function Sidebar({
                                    rooms = [],
                                    selectedRoom,
                                    onSelectRoom,
                                    onlineUsers = [],
                                    onLogout,
                                    onRoomCreated,
                                    onNewChat,
                                    currentUserEmail,
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

    // --------------------------------------------------
    // ROOM CATEGORIES
    // --------------------------------------------------

    const chats = rooms.filter(
        (room) => room.roomType === "CHAT"
    );

    const groups = rooms.filter(
        (room) => room.roomType === "GROUP"
    );

    const channels = rooms.filter(
        (room) => room.roomType === "CHANNEL"
    );

    let categoryRooms = [];

    if (activeCategory === "CHAT") {
        categoryRooms = chats;
    } else if (activeCategory === "GROUP") {
        categoryRooms = groups;
    } else {
        categoryRooms = channels;
    }

    // --------------------------------------------------
    // UNREAD COUNTS
    // --------------------------------------------------

    const hasUnread = {
        CHAT: chats.some(
            (room) => Number(room.unreadCount || 0) > 0
        ),

        GROUP: groups.some(
            (room) => Number(room.unreadCount || 0) > 0
        ),

        CHANNEL: channels.some(
            (room) => Number(room.unreadCount || 0) > 0
        ),
    };

    // --------------------------------------------------
    // SELECTED ROOM
    // --------------------------------------------------

    const selectedRoomData = rooms.find(
        (room) => room.roomCode === selectedRoom
    );

    // --------------------------------------------------
    // CREATE GROUP
    // --------------------------------------------------

    const createGroup = async (roomName) => {
        try {
            const name = roomName?.trim();

            if (!name) {
                return;
            }

            const newRoom = await createRoom(
                name,
                "GROUP"
            );

            setShowGroupModal(false);

            if (onRoomCreated) {
                onRoomCreated(newRoom);
            }
        } catch (error) {
            console.error(
                "CREATE GROUP ERROR:",
                error
            );
        }
    };

    // --------------------------------------------------
    // CREATE CHANNEL
    // --------------------------------------------------

    const createChannel = async (roomName) => {
        try {
            const name = roomName?.trim();

            if (!name) {
                return;
            }

            const newRoom = await createRoom(
                name,
                "CHANNEL"
            );

            setShowChannelModal(false);

            if (onRoomCreated) {
                onRoomCreated(newRoom);
            }
        } catch (error) {
            console.error(
                "CREATE CHANNEL ERROR:",
                error
            );
        }
    };

    // --------------------------------------------------
    // PLUS BUTTON
    // --------------------------------------------------

    const handleAddClick = () => {
        if (activeCategory === "CHAT") {
            if (onNewChat) {
                onNewChat();
            }

            return;
        }

        if (activeCategory === "GROUP") {
            setShowGroupModal(true);
            return;
        }

        if (activeCategory === "CHANNEL") {
            setShowChannelModal(true);
        }
    };

    // --------------------------------------------------
    // ROOM NAME
    // --------------------------------------------------

    const getRoomDisplayName = (room) => {
        if (room.roomType === "CHAT") {
            return (
                room.otherUserName ||
                room.roomName ||
                room.otherUserEmail ||
                "Unknown User"
            );
        }

        return room.roomName || "Unnamed Room";
    };

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <>
            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <div
                className={`
                    ${
                    selectedRoom
                        ? "hidden md:flex"
                        : "flex"
                }
                    w-full
                    md:w-[360px]
                    lg:w-[380px]
                    shrink-0
                    h-full
                    min-h-0
                    bg-white
                    dark:bg-stone-900
                `}
            >
                <div className="w-full h-full min-h-0 flex flex-col">

                    {/* ==================================================
                        SAMVAAD HEADER
                    ================================================== */}

                    <div
                        className="
                            h-[104px]
                            shrink-0
                            flex
                            items-center
                            px-5
                            border-b
                            dark:border-stone-700
                            bg-white
                            dark:bg-stone-900
                        "
                    >
                        <img
                            src="/icon-192.png"
                            alt="Samvaad"
                            className="
                                w-14
                                h-14
                                rounded-2xl
                                shrink-0
                                object-cover
                            "
                        />

                        <div className="ml-3 min-w-0">
                            <h1
                                className="
                                    text-2xl
                                    font-extrabold
                                    bg-gradient-to-r
                                    from-teal-500
                                    to-cyan-500
                                    dark:from-teal-400
                                    dark:to-cyan-300
                                    bg-clip-text
                                    text-transparent
                                    leading-tight
                                "
                            >
                                Samvaad
                            </h1>

                            <p
                                className="
                                    text-sm
                                    text-gray-400
                                    dark:text-stone-400
                                    mt-1
                                    truncate
                                "
                            >
                                Where conversations feel like home
                            </p>
                        </div>
                    </div>

                    {/* ==================================================
                        MAIN SIDEBAR BODY
                    ================================================== */}

                    <div className="flex flex-1 min-h-0">

                        {/* ==================================================
                            ICON RAIL
                        ================================================== */}

                        <IconRail
                            activeCategory={activeCategory}
                            onCategoryChange={setActiveCategory}
                            hasUnread={hasUnread}
                            profile={profile}
                            onOpenProfileMenu={() =>
                                setMenuOpen(
                                    (open) => !open
                                )
                            }
                            menuOpen={menuOpen}
                            profileMenuNode={
                                <ProfileMenu
                                    onClose={() =>
                                        setMenuOpen(false)
                                    }

                                    onSettings={() => {
                                        setActiveModal(
                                            "settings"
                                        );

                                        setMenuOpen(false);
                                    }}

                                    onUpdatePhoto={() => {
                                        setActiveModal(
                                            "photo"
                                        );

                                        setMenuOpen(false);
                                    }}

                                    onAboutStatus={() => {
                                        setActiveModal(
                                            "about"
                                        );

                                        setMenuOpen(false);
                                    }}

                                    onLogout={onLogout}
                                />
                            }
                        />

                        {/* ==================================================
                            ROOM LIST
                        ================================================== */}

                        <div
                            className="
                                flex-1
                                min-w-0
                                flex
                                flex-col
                                bg-white
                                dark:bg-stone-900
                            "
                        >

                            {/* CATEGORY HEADER */}

                            <div
                                className="
                                    h-[58px]
                                    shrink-0
                                    px-5
                                    border-b
                                    dark:border-stone-700
                                    flex
                                    items-center
                                    justify-between
                                "
                            >
                                <h2
                                    className="
                                        text-lg
                                        font-bold
                                        text-gray-900
                                        dark:text-stone-100
                                    "
                                >
                                    {
                                        CATEGORY_LABELS[
                                            activeCategory
                                            ]
                                    }
                                </h2>

                                <button
                                    type="button"
                                    onClick={handleAddClick}
                                    className="
                                        text-blue-600
                                        dark:text-teal-400
                                        text-2xl
                                        font-bold
                                        hover:text-blue-800
                                        dark:hover:text-teal-300
                                        w-8
                                        h-8
                                        flex
                                        items-center
                                        justify-center
                                        rounded-full
                                        hover:bg-gray-100
                                        dark:hover:bg-stone-800
                                    "
                                    aria-label={
                                        activeCategory ===
                                        "CHAT"
                                            ? "New chat"
                                            : activeCategory ===
                                            "GROUP"
                                                ? "Create group"
                                                : "Create channel"
                                    }
                                >
                                    +
                                </button>
                            </div>

                            {/* ROOM SCROLL AREA */}

                            <div
                                className="
                                    flex-1
                                    overflow-y-auto
                                    p-4
                                "
                            >

                                {/* ==================================================
                                    ROOMS
                                ================================================== */}

                                {categoryRooms.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <p
                                            className="
                                                text-sm
                                                text-gray-400
                                                dark:text-stone-500
                                            "
                                        >
                                            No rooms
                                        </p>
                                    </div>
                                ) : (
                                    categoryRooms.map(
                                        (room) => {
                                            const isSelected =
                                                selectedRoom ===
                                                room.roomCode;

                                            const unreadCount =
                                                Number(
                                                    room.unreadCount ||
                                                    0
                                                );

                                            return (
                                                <div
                                                    key={
                                                        room.roomCode
                                                    }
                                                    onClick={() =>
                                                        onSelectRoom(
                                                            room.roomCode
                                                        )
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
                                                        isSelected
                                                            ? "bg-[#993556] text-white"
                                                            : "border dark:border-stone-700 text-gray-900 dark:text-stone-100 hover:bg-blue-50 dark:hover:bg-stone-800"
                                                    }
                                                    `}
                                                >
                                                    {/* ROOM NAME */}

                                                    <div className="min-w-0 flex-1">
                                                        <span
                                                            className="
                                                                block
                                                                truncate
                                                            "
                                                        >
                                                            {
                                                                getRoomDisplayName(
                                                                    room
                                                                )
                                                            }
                                                        </span>

                                                        {/* Helpful fallback for
                                                            chat rooms */}
                                                        {room.roomType ===
                                                            "CHAT" &&
                                                            !room.otherUserName &&
                                                            room.otherUserEmail && (
                                                                <span
                                                                    className={`
                                                                        block
                                                                        text-xs
                                                                        truncate
                                                                        mt-0.5
                                                                        ${
                                                                        isSelected
                                                                            ? "text-white/70"
                                                                            : "text-gray-400 dark:text-stone-500"
                                                                    }
                                                                    `}
                                                                >
                                                                    {
                                                                        room.otherUserEmail
                                                                    }
                                                                </span>
                                                            )}
                                                    </div>

                                                    {/* UNREAD BADGE */}

                                                    {unreadCount >
                                                        0 && (
                                                            <span
                                                                className={`
                                                                shrink-0
                                                                min-w-[20px]
                                                                h-5
                                                                px-1.5
                                                                rounded-full
                                                                text-xs
                                                                font-semibold
                                                                flex
                                                                items-center
                                                                justify-center
                                                                ${
                                                                    isSelected
                                                                        ? "bg-white text-[#993556]"
                                                                        : "bg-[#993556] text-white"
                                                                }
                                                            `}
                                                            >
                                                            {unreadCount >
                                                            99
                                                                ? "99+"
                                                                : unreadCount}
                                                        </span>
                                                        )}
                                                </div>
                                            );
                                        }
                                    )
                                )}

                                {/* ==================================================
                                    ONLINE USERS
                                ================================================== */}

                                {activeCategory ===
                                    "CHAT" && (
                                        <>
                                            <div
                                                className="
                                                my-5
                                                border-t
                                                dark:border-stone-700
                                            "
                                            />

                                            <OnlineUsers
                                                users={onlineUsers}
                                                currentUserEmail={
                                                    currentUserEmail
                                                }
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

            {/* ==================================================
                PROFILE PHOTO MODAL
            ================================================== */}

            {activeModal === "photo" && (
                <UpdatePhotoModal
                    currentPhoto={
                        profile?.profileImageBase64
                    }
                    onClose={() =>
                        setActiveModal(null)
                    }
                    onUpdated={(updatedProfile) => {
                        setProfile(updatedProfile);
                        setActiveModal(null);
                    }}
                />
            )}

            {/* ==================================================
                ABOUT STATUS MODAL
            ================================================== */}

            {activeModal === "about" && (
                <AboutStatusModal
                    currentStatus={
                        profile?.aboutStatus
                    }
                    onClose={() =>
                        setActiveModal(null)
                    }
                    onUpdated={(updatedProfile) => {
                        setProfile(updatedProfile);
                        setActiveModal(null);
                    }}
                />
            )}

            {/* ==================================================
                SETTINGS MODAL
            ================================================== */}

            {activeModal === "settings" && (
                <SettingsModal
                    profile={profile}
                    onClose={() =>
                        setActiveModal(null)
                    }
                />
            )}

            {/* ==================================================
                CREATE GROUP MODAL
            ================================================== */}

            {showGroupModal && (
                <CreateGroupModal
                    onClose={() =>
                        setShowGroupModal(false)
                    }
                    onCreate={createGroup}
                />
            )}

            {/* ==================================================
                CREATE CHANNEL MODAL
            ================================================== */}

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