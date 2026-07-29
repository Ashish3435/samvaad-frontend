import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
    logout,
    getCurrentUser
} from "../services/authService";

import {
    getMessages,
    markMessagesAsSeen
} from "../services/messageService";

import {
    getOnlineUsers
} from "../services/userService";

import {
    getRooms,
    createPrivateRoom
} from "../services/roomService";

import {
    connectWebSocket,
    disconnectWebSocket,
    sendMessage
} from "../services/websocket";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import NewChatModal from "../components/NewChatModal";


export default function Chat() {

    const navigate = useNavigate();
    const bottomRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [typingUser, setTypingUser] = useState("");

    /* CURRENT LOGGED-IN USER */
    const currentUserEmail = getCurrentUser()?.trim().toLowerCase();

    /* KEEP LAYOUT HEIGHT IN SYNC WITH VISIBLE VIEWPORT
       (fixes keyboard covering the input bar on mobile) */
    const [viewportHeight, setViewportHeight] = useState(
        window.visualViewport?.height || window.innerHeight
    );

    useEffect(() => {
        const viewport = window.visualViewport;

        if (!viewport) {
            return;
        }

        const handleViewportResize = () => {
            setViewportHeight(viewport.height);
        };

        viewport.addEventListener("resize", handleViewportResize);

        return () => {
            viewport.removeEventListener("resize", handleViewportResize);
        };
    }, []);

    /* LOAD ROOMS */
    const loadRooms = useCallback(async () => {
        try {
            const data = await getRooms();
            console.log("ROOMS FROM BACKEND:", data);
            setRooms(data);

            setSelectedRoom((currentSelectedRoom) => {
                if (
                    currentSelectedRoom &&
                    data.some((room) => room.roomCode === currentSelectedRoom)
                ) {
                    return currentSelectedRoom;
                }
                return data.length > 0 ? data[0].roomCode : "";
            });
        } catch (error) {
            console.error("ROOM ERROR:", error);
        }
    }, []);

    /* LOAD MESSAGES */
    const loadMessages = useCallback(async (roomCode) => {
        try {
            const data = await getMessages(roomCode);
            setMessages(data);
        } catch (error) {
            console.error("MESSAGE ERROR:", error);
        }
    }, []);

    /* LOAD ONLINE USERS */
    const loadOnlineUsers = useCallback(async () => {
        try {
            const data = await getOnlineUsers();
            setOnlineUsers(data);
        } catch (error) {
            console.error("ONLINE USERS ERROR:", error);
        }
    }, []);

    /* INITIAL LOAD */
    useEffect(() => {
        loadRooms();
        loadOnlineUsers();

        const interval = setInterval(loadOnlineUsers, 5000);

        return () => {
            clearInterval(interval);
            disconnectWebSocket();
        };
    }, [loadRooms, loadOnlineUsers]);

    /* ROOM CHANGE */
    useEffect(() => {
        if (!selectedRoom) {
            return;
        }

        disconnectWebSocket();

        setMessages([]);
        setTypingUser("");

        /* LOAD OLD MESSAGES */
        loadMessages(selectedRoom);

        /* MARK OTHER USER MESSAGES AS SEEN (on room open) */
        markMessagesAsSeen(selectedRoom).catch((error) => {
            console.error("MARK SEEN ERROR:", error);
        });

        /* WEBSOCKET */
        connectWebSocket(
            selectedRoom,

            /* NEW MESSAGE */
            (message) => {
                setMessages((previousMessages) => {
                    return [...previousMessages, message];
                });

                /* MARK AS SEEN IMMEDIATELY IF THIS ARRIVED
                   FROM THE OTHER USER WHILE THE ROOM IS OPEN */
                if (
                    message.senderEmail?.trim().toLowerCase() !==
                    currentUserEmail
                ) {
                    markMessagesAsSeen(selectedRoom).catch((error) => {
                        console.error("MARK SEEN ERROR:", error);
                    });
                }
            },

            /* TYPING */
            (typingData) => {
                const typingEmail =
                    typingData.email?.trim().toLowerCase();

                /* IGNORE MY OWN TYPING BROADCAST —
                   I'm also subscribed to this topic, so without
                   this filter I'd see my own name as "typing" */
                if (typingEmail === currentUserEmail) {
                    return;
                }

                setTypingUser(
                    typingData.typing ? typingEmail : ""
                );
            },

            /* MESSAGE SEEN */
            (seenData) => {
                setMessages((previousMessages) => {
                    return previousMessages.map((message) => {
                        if (
                            message.senderEmail?.trim().toLowerCase() ===
                            currentUserEmail &&
                            message.roomCode === seenData.roomCode
                        ) {
                            return {
                                ...message,
                                seen: true
                            };
                        }
                        return message;
                    });
                });
            }
        );

        return () => {
            disconnectWebSocket();
        };
    }, [selectedRoom, loadMessages, currentUserEmail]);

    /* AUTO SCROLL */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* SEND MESSAGE */
    const handleSend = (text) => {
        if (!text || !text.trim() || !selectedRoom) {
            return;
        }

        sendMessage({
            roomCode: selectedRoom,
            content: text
        });
    };

    /* ROOM CREATED */
    const handleRoomCreated = async (newRoom) => {
        try {
            const updatedRooms = await getRooms();
            setRooms(updatedRooms);
            setSelectedRoom(newRoom.roomCode);
        } catch (error) {
            console.error("ROOM REFRESH ERROR:", error);
        }
    };

    /* USER SELECTED FOR PRIVATE CHAT */
    const handleUserSelected = async (user) => {
        try {
            setShowNewChat(false);

            const privateRoom = await createPrivateRoom(user.email);
            const updatedRooms = await getRooms();

            setRooms(updatedRooms);
            setSelectedRoom(privateRoom.roomCode);
        } catch (error) {
            console.error("PRIVATE CHAT ERROR:", error);
        }
    };

    /* LOGOUT */
    const handleLogout = () => {
        disconnectWebSocket();
        logout();
        navigate("/login");
    };

    /* SELECTED ROOM */
    const selectedRoomData = rooms.find(
        (room) => room.roomCode === selectedRoom
    );

    console.log("SELECTED ROOM:", selectedRoomData);

    /* ROOM TYPE */
    const selectedRoomType = selectedRoomData?.roomType;

    console.log("CURRENT USER:", currentUserEmail);

    /* HEADER NAME — uses backend-computed otherUserName */
    const displayRoomName =
        selectedRoomType === "CHAT" && selectedRoomData?.otherUserName
            ? selectedRoomData.otherUserName
            : selectedRoomData?.roomName || selectedRoom;

    /* ONLINE STATUS — uses backend-computed otherUserEmail */
    const isOpponentOnline =
        selectedRoomData?.otherUserEmail
            ? onlineUsers.some(
                (user) =>
                    user.email?.trim().toLowerCase() ===
                    selectedRoomData.otherUserEmail?.trim().toLowerCase()
            )
            : false;

    /* TYPING DISPLAY NAME — show the other person's name
       instead of raw email, when it matches the current chat */
    const typingDisplayName =
        typingUser &&
        selectedRoomData?.otherUserEmail?.trim().toLowerCase() === typingUser
            ? selectedRoomData.otherUserName
            : typingUser;

    /* UI */
    return (
        <div
            className="flex bg-slate-100 overflow-hidden"
            style={{ height: `${viewportHeight}px` }}
        >
            <Sidebar
                rooms={rooms}
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
                onlineUsers={onlineUsers}
                onLogout={handleLogout}
                onRoomCreated={handleRoomCreated}
                onNewChat={() => {
                    setShowNewChat(true);
                }}
                currentUserEmail={currentUserEmail}
            />

            <div
                className={`${
                    selectedRoom ? "flex" : "hidden md:flex"
                } flex-1 flex-col min-w-0`}
            >
                {/* HEADER */}
                <div className="bg-white border-b px-5 py-3 flex items-center gap-3 shrink-0">
                    {/* BACK BUTTON — mobile only */}
                    <button
                        onClick={() => setSelectedRoom("")}
                        className="md:hidden text-blue-600 font-bold text-xl px-1"
                    >
                        ←
                    </button>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold truncate">
                            {displayRoomName}
                        </h2>

                        {typingUser ? (
                            <p className="text-sm text-green-600">
                                {typingDisplayName} is typing...
                            </p>
                        ) : (
                            selectedRoomType === "CHAT" &&
                            selectedRoomData?.otherUserEmail && (
                                <p
                                    className={`text-sm ${
                                        isOpponentOnline
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    <span className="mr-1">●</span>
                                    {isOpponentOnline ? "Online" : "Offline"}
                                </p>
                            )
                        )}
                    </div>
                </div>

                {/* MESSAGES */}
                <ChatWindow messages={messages} bottomRef={bottomRef} />

                {/* INPUT */}
                <ChatInput onSend={handleSend} roomCode={selectedRoom} />
            </div>

            {/* NEW CHAT MODAL */}
            {showNewChat && (
                <NewChatModal
                    onClose={() => {
                        setShowNewChat(false);
                    }}
                    onUserSelected={handleUserSelected}
                />
            )}
        </div>
    );
}