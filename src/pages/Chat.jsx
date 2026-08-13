import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    useNavigate,
    useLocation
} from "react-router-dom";

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
    subscribeToRoom,
    sendMessage,
    sendCallSignal
} from "../services/websocket";

import {
    initWebRTC,
    getLocalStream,
    getLocalStreamRef,
    createOfferTo,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    endCall,
    toggleMic,
    toggleCamera
} from "../services/webrtcService";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import NewChatModal from "../components/NewChatModal";
import GroupInfoModal from "../components/GroupInfoModal";
import CallModal from "../components/CallModal";

const SELECTED_ROOM_KEY = "selectedRoom";

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

const notifyIfAllowed = (title, options) => {
    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        return new Notification(title, options);
    }

    return null;
};

export default function Chat() {
    const navigate = useNavigate();
    const location = useLocation();

    const bottomRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [selectedRoom, setSelectedRoom] = useState(
        () =>
            sessionStorage.getItem(
                SELECTED_ROOM_KEY
            ) || ""
    );

    const [showNewChat, setShowNewChat] =
        useState(false);

    const [typingUser, setTypingUser] =
        useState("");

    const [showGroupInfo, setShowGroupInfo] =
        useState(false);

    const [callState, setCallState] =
        useState(null);

    const [localStream, setLocalStream] =
        useState(null);

    const [micOn, setMicOn] =
        useState(true);

    const [cameraOn, setCameraOn] =
        useState(true);

    const currentUserEmail =
        getCurrentUser()?.trim().toLowerCase();

    const selectedRoomRef =
        useRef(selectedRoom);

    const roomsRef =
        useRef(rooms);

    useEffect(() => {
        selectedRoomRef.current =
            selectedRoom;
    }, [selectedRoom]);

    useEffect(() => {
        roomsRef.current = rooms;
    }, [rooms]);

    const selectRoom = useCallback(
        (roomCode) => {
            setSelectedRoom(roomCode);

            if (roomCode) {
                window.history.pushState(
                    { chatRoom: roomCode },
                    "",
                    location.pathname
                );
            }
        },
        [location.pathname]
    );

    useEffect(() => {
        if (selectedRoom) {
            sessionStorage.setItem(
                SELECTED_ROOM_KEY,
                selectedRoom
            );
        } else {
            sessionStorage.removeItem(
                SELECTED_ROOM_KEY
            );
        }
    }, [selectedRoom]);

    useEffect(() => {
        const handlePopState = () => {
            if (selectedRoomRef.current) {
                setSelectedRoom("");
            }
        };

        window.addEventListener(
            "popstate",
            handlePopState
        );

        return () => {
            window.removeEventListener(
                "popstate",
                handlePopState
            );
        };
    }, []);

    useEffect(() => {
        if (
            "Notification" in window &&
            Notification.permission === "default"
        ) {
            Notification.requestPermission();
        }
    }, []);

    const loadRooms = useCallback(async () => {
        try {
            const data = await getRooms();

            setRooms(data);

            setSelectedRoom(
                (currentSelectedRoom) => {
                    if (
                        currentSelectedRoom &&
                        data.some(
                            (room) =>
                                room.roomCode ===
                                currentSelectedRoom
                        )
                    ) {
                        return currentSelectedRoom;
                    }

                    return "";
                }
            );
        } catch (error) {
            console.error(
                "ROOM ERROR:",
                error
            );
        }
    }, []);

    const loadMessages = useCallback(
        async (roomCode) => {
            try {
                const data =
                    await getMessages(roomCode);

                setMessages(data);
            } catch (error) {
                console.error(
                    "MESSAGE ERROR:",
                    error
                );
            }
        },
        []
    );

    const loadOnlineUsers =
        useCallback(async () => {
            try {
                const data =
                    await getOnlineUsers();

                setOnlineUsers(data);
            } catch (error) {
                console.error(
                    "ONLINE USERS ERROR:",
                    error
                );
            }
        }, []);

    const findMemberName =
        useCallback(
            (email) => {
                for (const room of rooms) {
                    const member =
                        room.members?.find(
                            (m) =>
                                m.email
                                    ?.trim()
                                    .toLowerCase() ===
                                email
                        );

                    if (member) {
                        return member.fullName;
                    }
                }

                return email;
            },
            [rooms]
        );

    const handleNotification =
        useCallback(
            (message) => {
                const room =
                    roomsRef.current.find(
                        (r) =>
                            r.roomCode ===
                            message.roomCode
                    );

                const isRoomOpen =
                    selectedRoomRef.current ===
                    message.roomCode;

                const isTabHidden =
                    document.visibilityState ===
                    "hidden";

                const shouldBumpUnread =
                    !isRoomOpen;

                setRooms(
                    (previousRooms) => {
                        const updated =
                            previousRooms.map(
                                (r) => {
                                    if (
                                        r.roomCode !==
                                        message.roomCode
                                    ) {
                                        return r;
                                    }

                                    return {
                                        ...r,
                                        lastMessageAt:
                                        message.sentAt,
                                        unreadCount:
                                            shouldBumpUnread
                                                ? (r.unreadCount ||
                                                0) + 1
                                                : r.unreadCount
                                    };
                                }
                            );

                        return [...updated].sort(
                            (a, b) => {
                                if (
                                    !a.lastMessageAt &&
                                    !b.lastMessageAt
                                ) {
                                    return 0;
                                }

                                if (
                                    !a.lastMessageAt
                                ) {
                                    return 1;
                                }

                                if (
                                    !b.lastMessageAt
                                ) {
                                    return -1;
                                }

                                return (
                                    new Date(
                                        b.lastMessageAt
                                    ) -
                                    new Date(
                                        a.lastMessageAt
                                    )
                                );
                            }
                        );
                    }
                );

                if (
                    isRoomOpen &&
                    !isTabHidden
                ) {
                    return;
                }

                const isGroupOrChannel =
                    room?.roomType ===
                    "GROUP" ||
                    room?.roomType ===
                    "CHANNEL";

                const bodyText =
                    message.content
                        ? message.content
                        : message.attachmentType?.startsWith(
                            "image/"
                        )
                            ? "📷 Photo"
                            : "📄 File";

                const title =
                    message.mentioned
                        ? `${message.senderName} mentioned you`
                        : isGroupOrChannel
                            ? `${message.senderName} in ${
                                room?.roomName ||
                                "group"
                            }`
                            : message.senderName ||
                            "New message";

                const notification =
                    notifyIfAllowed(
                        title,
                        {
                            body: bodyText,
                            icon: "/favicon.ico",
                            tag: message.mentioned
                                ? `mention-${message.roomCode}-${message.id}`
                                : message.roomCode,
                            requireInteraction:
                                Boolean(
                                    message.mentioned
                                )
                        }
                    );

                if (notification) {
                    notification.onclick =
                        () => {
                            window.focus();

                            selectRoom(
                                message.roomCode
                            );

                            notification.close();
                        };
                }
            },
            [selectRoom]
        );

    const handleCallSignal =
        useCallback(
            async (data) => {
                switch (data.type) {
                    case "call-invite": {
                        setCallState((prev) => {
                            if (prev) {
                                return prev;
                            }

                            const callerName =
                                findMemberName(
                                    data.targetEmail
                                );

                            if (
                                document.visibilityState ===
                                "hidden"
                            ) {
                                const notification =
                                    notifyIfAllowed(
                                        `Incoming ${
                                            data.callType ===
                                            "video"
                                                ? "video"
                                                : "voice"
                                        } call`,
                                        {
                                            body: `${callerName} is calling you`,
                                            icon: "/favicon.ico",
                                            tag: `call-${data.roomCode}`,
                                            requireInteraction:
                                                true
                                        }
                                    );

                                if (
                                    notification
                                ) {
                                    notification.onclick =
                                        () => {
                                            window.focus();
                                            notification.close();
                                        };
                                }
                            }

                            return {
                                status:
                                    "ringing-incoming",
                                roomCode:
                                data.roomCode,
                                callType:
                                data.callType,
                                callerEmail:
                                data.targetEmail,
                                callerName,
                                participants: {}
                            };
                        });

                        break;
                    }

                    case "call-accept": {
                        const acceptorEmail =
                            data.targetEmail;

                        setCallState((prev) => {
                            if (
                                !prev ||
                                prev.status !==
                                "ringing-outgoing"
                            ) {
                                return prev;
                            }

                            const existingPeers =
                                Object.keys(
                                    prev.participants
                                );

                            sendCallSignal({
                                type:
                                    "call-peers-list",
                                roomCode:
                                prev.roomCode,
                                targetEmail:
                                acceptorEmail,
                                payload: {
                                    peers: [
                                        currentUserEmail,
                                        ...existingPeers
                                    ]
                                }
                            });

                            return {
                                ...prev,
                                status: "in-call",
                                participants: {
                                    ...prev.participants,
                                    [acceptorEmail]: {
                                        name: findMemberName(
                                            acceptorEmail
                                        ),
                                        stream: null
                                    }
                                }
                            };
                        });

                        break;
                    }

                    case "call-reject": {
                        setCallState(null);
                        endCall();
                        break;
                    }

                    case "call-end": {
                        endCall();
                        setCallState(null);
                        break;
                    }

                    case "call-peers-list": {
                        const peers =
                            data.payload?.peers ||
                            [];

                        for (
                            const peerEmail of peers
                            ) {
                            await createOfferTo(
                                peerEmail
                            );
                        }

                        break;
                    }

                    case "webrtc-offer": {
                        await handleOffer(
                            data.targetEmail,
                            data.payload
                        );

                        setCallState((prev) => {
                            if (!prev) {
                                return prev;
                            }

                            return {
                                ...prev,
                                participants: {
                                    ...prev.participants,
                                    [data.targetEmail]:
                                        prev.participants[
                                            data.targetEmail
                                            ] || {
                                            name: findMemberName(
                                                data.targetEmail
                                            ),
                                            stream: null
                                        }
                                }
                            };
                        });

                        break;
                    }

                    case "webrtc-answer": {
                        await handleAnswer(
                            data.targetEmail,
                            data.payload
                        );

                        break;
                    }

                    case "webrtc-ice-candidate": {
                        await handleIceCandidate(
                            data.targetEmail,
                            data.payload
                        );

                        break;
                    }

                    default:
                        break;
                }
            },
            [
                currentUserEmail,
                findMemberName
            ]
        );

    const handleCallSignalRef =
        useRef(handleCallSignal);

    const handleNotificationRef =
        useRef(handleNotification);

    useEffect(() => {
        handleCallSignalRef.current =
            handleCallSignal;
    }, [handleCallSignal]);

    useEffect(() => {
        handleNotificationRef.current =
            handleNotification;
    }, [handleNotification]);

    useEffect(() => {
        initWebRTC({
            sendSignalFn:
            sendCallSignal,

            onRemoteStreamFn: (
                peerEmail,
                stream
            ) => {
                setCallState((prev) => {
                    if (!prev) {
                        return prev;
                    }

                    return {
                        ...prev,
                        participants: {
                            ...prev.participants,
                            [peerEmail]: {
                                ...(prev
                                    .participants[
                                    peerEmail
                                    ] || {
                                    name: peerEmail
                                }),
                                stream
                            }
                        }
                    };
                });
            },

            onPeerLeftFn: (
                peerEmail
            ) => {
                setCallState((prev) => {
                    if (!prev) {
                        return prev;
                    }

                    const updated = {
                        ...prev.participants
                    };

                    delete updated[
                        peerEmail
                        ];

                    return {
                        ...prev,
                        participants:
                        updated
                    };
                });
            }
        });
    }, []);

    useEffect(() => {
        connectWebSocket(
            (data) =>
                handleCallSignalRef.current(
                    data
                ),
            (data) =>
                handleNotificationRef.current(
                    data
                )
        );

        loadRooms();
        loadOnlineUsers();

        const interval =
            setInterval(
                loadOnlineUsers,
                5000
            );

        return () => {
            clearInterval(interval);
        };
    }, [
        loadRooms,
        loadOnlineUsers
    ]);

    useEffect(() => {
        if (!selectedRoom) {
            return;
        }

        setMessages([]);
        setTypingUser("");

        loadMessages(selectedRoom);

        markMessagesAsSeen(
            selectedRoom
        ).catch((error) => {
            console.error(
                "MARK SEEN ERROR:",
                error
            );
        });

        setRooms(
            (previousRooms) =>
                previousRooms.map(
                    (room) =>
                        room.roomCode ===
                        selectedRoom
                            ? {
                                ...room,
                                unreadCount: 0
                            }
                            : room
                )
        );

        subscribeToRoom(
            selectedRoom,

            (message) => {
                setMessages(
                    (previousMessages) => [
                        ...previousMessages,
                        message
                    ]
                );

                if (
                    message.senderEmail
                        ?.trim()
                        .toLowerCase() !==
                    currentUserEmail
                ) {
                    markMessagesAsSeen(
                        selectedRoom
                    ).catch((error) => {
                        console.error(
                            "MARK SEEN ERROR:",
                            error
                        );
                    });
                }
            },

            (typingData) => {
                const typingEmail =
                    typingData.email
                        ?.trim()
                        .toLowerCase();

                if (
                    typingEmail ===
                    currentUserEmail
                ) {
                    return;
                }

                setTypingUser(
                    typingData.typing
                        ? typingEmail
                        : ""
                );
            },

            (seenData) => {
                setMessages(
                    (previousMessages) =>
                        previousMessages.map(
                            (message) => {
                                if (
                                    message.senderEmail
                                        ?.trim()
                                        .toLowerCase() ===
                                    currentUserEmail &&
                                    message.roomCode ===
                                    seenData.roomCode
                                ) {
                                    return {
                                        ...message,
                                        seen: true
                                    };
                                }

                                return message;
                            }
                        )
                );
            }
        );
    }, [
        selectedRoom,
        loadMessages,
        currentUserEmail
    ]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    const handleSend = (
        text,
        attachment
    ) => {
        if (
            (!text || !text.trim()) &&
            !attachment
        ) {
            return;
        }

        if (!selectedRoom) {
            return;
        }

        sendMessage({
            roomCode: selectedRoom,
            content:
                text?.trim() || null,
            attachmentData:
                attachment?.data || null,
            attachmentType:
                attachment?.type || null,
            attachmentName:
                attachment?.name || null
        });
    };

    const handleRoomCreated =
        async (newRoom) => {
            try {
                const updatedRooms =
                    await getRooms();

                setRooms(updatedRooms);

                selectRoom(
                    newRoom.roomCode
                );
            } catch (error) {
                console.error(
                    "ROOM REFRESH ERROR:",
                    error
                );
            }
        };

    const handleUserSelected =
        async (user) => {
            try {
                setShowNewChat(false);

                const privateRoom =
                    await createPrivateRoom(
                        user.email
                    );

                const updatedRooms =
                    await getRooms();

                setRooms(updatedRooms);

                selectRoom(
                    privateRoom.roomCode
                );
            } catch (error) {
                console.error(
                    "PRIVATE CHAT ERROR:",
                    error
                );
            }
        };

    const handleRoomUpdated = (
        updatedRoom
    ) => {
        setRooms(
            (previousRooms) =>
                previousRooms.map(
                    (room) =>
                        room.roomCode ===
                        updatedRoom.roomCode
                            ? {
                                ...updatedRoom,
                                unreadCount:
                                room.unreadCount
                            }
                            : room
                )
        );
    };

    const handleLogout = () => {
        endCall();
        disconnectWebSocket();

        sessionStorage.removeItem(
            SELECTED_ROOM_KEY
        );

        logout();

        navigate("/login");
    };

    const startCall = async (
        callType
    ) => {
        if (
            callState ||
            !selectedRoom
        ) {
            return;
        }

        try {
            const stream =
                await getLocalStream(
                    callType
                );

            setLocalStream(stream);
            setMicOn(true);

            setCameraOn(
                callType === "video"
            );

            sendCallSignal({
                type: "call-invite",
                roomCode: selectedRoom,
                callType
            });

            setCallState({
                status:
                    "ringing-outgoing",
                roomCode:
                selectedRoom,
                callType,
                participants: {}
            });
        } catch (error) {
            console.error(
                "CALL START ERROR:",
                error
            );

            alert(
                "Could not access microphone/camera."
            );
        }
    };

    const acceptCall = async () => {
        if (!callState) {
            return;
        }

        try {
            const stream =
                await getLocalStream(
                    callState.callType
                );

            setLocalStream(stream);
            setMicOn(true);

            setCameraOn(
                callState.callType ===
                "video"
            );

            sendCallSignal({
                type: "call-accept",
                roomCode:
                callState.roomCode,
                targetEmail:
                callState.callerEmail
            });

            setCallState((prev) => ({
                ...prev,
                status: "in-call"
            }));
        } catch (error) {
            console.error(
                "CALL ACCEPT ERROR:",
                error
            );

            alert(
                "Could not access microphone/camera."
            );
        }
    };

    const rejectCall = () => {
        if (!callState) {
            return;
        }

        sendCallSignal({
            type: "call-reject",
            roomCode:
            callState.roomCode,
            targetEmail:
            callState.callerEmail
        });

        setCallState(null);
    };

    const hangUp = () => {
        if (!callState) {
            return;
        }

        sendCallSignal({
            type: "call-end",
            roomCode:
            callState.roomCode
        });

        endCall();

        setCallState(null);
        setLocalStream(null);
    };

    const handleToggleMic = () => {
        const next = !micOn;

        toggleMic(next);
        setMicOn(next);
    };

    const handleToggleCamera = () => {
        const next = !cameraOn;

        toggleCamera(next);
        setCameraOn(next);
    };

    const selectedRoomData =
        rooms.find(
            (room) =>
                room.roomCode ===
                selectedRoom
        );

    const selectedRoomType =
        selectedRoomData?.roomType;

    const displayRoomName =
        selectedRoomType === "CHAT" &&
        selectedRoomData?.otherUserName
            ? selectedRoomData.otherUserName
            : selectedRoomData?.roomName ||
            selectedRoom;

    const isOpponentOnline =
        selectedRoomData
            ?.otherUserEmail
            ? onlineUsers.some(
                (user) =>
                    user.email
                        ?.trim()
                        .toLowerCase() ===
                    selectedRoomData
                        .otherUserEmail
                        ?.trim()
                        .toLowerCase()
            )
            : false;

    const typingDisplayName =
        typingUser &&
        selectedRoomData
            ?.otherUserEmail
            ?.trim()
            .toLowerCase() ===
        typingUser
            ? selectedRoomData
                .otherUserName
            : typingUser;

    const canSend =
        selectedRoomType ===
        "CHANNEL"
            ? Boolean(
                selectedRoomData?.admin
            )
            : true;

    const isGroupOrChannel =
        selectedRoomType ===
        "GROUP" ||
        selectedRoomType ===
        "CHANNEL";

    const canCall =
        !callState &&
        selectedRoom &&
        (
            selectedRoomType ===
            "CHAT" ||
            selectedRoomType ===
            "GROUP"
        );

    return (
        <div className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-slate-100 dark:bg-stone-950">

            {/* SIDEBAR */}
            <Sidebar
                rooms={rooms}
                selectedRoom={selectedRoom}
                onSelectRoom={
                    selectRoom
                }
                onlineUsers={
                    onlineUsers
                }
                onLogout={
                    handleLogout
                }
                onRoomCreated={
                    handleRoomCreated
                }
                onNewChat={() =>
                    setShowNewChat(
                        true
                    )
                }
                currentUserEmail={
                    currentUserEmail
                }
            />

            {/* CHAT AREA */}
            <div
                className={`${
                    selectedRoom
                        ? "flex"
                        : "hidden md:flex"
                } flex-1 min-w-0 min-h-0 h-full flex-col overflow-hidden`}
            >

                {selectedRoom ? (
                    <>

                        {/* CHAT HEADER */}
                        <div className="shrink-0 bg-white dark:bg-stone-900 border-b dark:border-stone-700 px-5 py-3 flex items-center gap-3">

                            <button
                                onClick={() =>
                                    setSelectedRoom(
                                        ""
                                    )
                                }
                                className="md:hidden text-blue-600 dark:text-teal-400 font-bold text-xl px-1"
                            >
                                ←
                            </button>

                            <button
                                onClick={() => {
                                    if (
                                        isGroupOrChannel
                                    ) {
                                        setShowGroupInfo(
                                            true
                                        );
                                    }
                                }}
                                className={`flex items-center gap-3 flex-1 min-w-0 text-left ${
                                    isGroupOrChannel
                                        ? "cursor-pointer"
                                        : "cursor-default"
                                }`}
                            >

                                {selectedRoomType ===
                                "CHAT" &&
                                selectedRoomData?.otherUserPhoto ? (
                                    <img
                                        src={
                                            selectedRoomData.otherUserPhoto
                                        }
                                        alt={
                                            displayRoomName
                                        }
                                        className="w-9 h-9 rounded-full object-cover border dark:border-stone-600 shrink-0"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                                        {getInitials(
                                            displayRoomName
                                        )}
                                    </div>
                                )}

                                <div className="min-w-0">

                                    <h2 className="text-xl font-bold truncate text-gray-900 dark:text-stone-100">
                                        {
                                            displayRoomName
                                        }
                                    </h2>

                                    {typingUser ? (
                                        <p className="text-sm text-green-600 dark:text-green-400 truncate">
                                            {
                                                typingDisplayName
                                            }{" "}
                                            is typing...
                                        </p>
                                    ) : isGroupOrChannel ? (
                                        <p className="text-sm text-gray-400 dark:text-stone-500">
                                            {
                                                selectedRoomData
                                                    ?.members
                                                    ?.length ||
                                                0
                                            }{" "}
                                            members
                                        </p>
                                    ) : (
                                        selectedRoomType ===
                                        "CHAT" &&
                                        selectedRoomData?.otherUserEmail && (
                                            <p
                                                className={`text-sm ${
                                                    isOpponentOnline
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-gray-400 dark:text-stone-500"
                                                }`}
                                            >
                                                <span className="mr-1">
                                                    ●
                                                </span>

                                                {isOpponentOnline
                                                    ? "Online"
                                                    : "Offline"}
                                            </p>
                                        )
                                    )}

                                </div>

                            </button>

                            {canCall && (
                                <div className="flex items-center gap-1 shrink-0">

                                    <button
                                        onClick={() =>
                                            startCall(
                                                "audio"
                                            )
                                        }
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800"
                                        aria-label="Voice call"
                                    >
                                        📞
                                    </button>

                                    <button
                                        onClick={() =>
                                            startCall(
                                                "video"
                                            )
                                        }
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800"
                                        aria-label="Video call"
                                    >
                                        🎥
                                    </button>

                                </div>
                            )}

                        </div>

                        {/* MESSAGE AREA */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <ChatWindow
                                messages={
                                    messages
                                }
                                bottomRef={
                                    bottomRef
                                }
                            />
                        </div>

                        {/* CHAT INPUT */}
                        <div className="shrink-0">
                            <ChatInput
                                onSend={
                                    handleSend
                                }
                                roomCode={
                                    selectedRoom
                                }
                                canSend={
                                    canSend
                                }
                            />
                        </div>

                    </>
                ) : (
                    <div className="hidden md:flex flex-1 min-h-0 items-center justify-center text-gray-400 dark:text-stone-500">
                        Select a chat to start
                        messaging
                    </div>
                )}

            </div>

            {/* NEW CHAT MODAL */}
            {showNewChat && (
                <NewChatModal
                    onClose={() =>
                        setShowNewChat(
                            false
                        )
                    }
                    onUserSelected={
                        handleUserSelected
                    }
                />
            )}

            {/* GROUP INFO MODAL */}
            {showGroupInfo &&
                selectedRoomData && (
                    <GroupInfoModal
                        room={
                            selectedRoomData
                        }
                        currentUserEmail={
                            currentUserEmail
                        }
                        onClose={() =>
                            setShowGroupInfo(
                                false
                            )
                        }
                        onUpdated={
                            handleRoomUpdated
                        }
                    />
                )}

            {/* CALL MODAL */}
            <CallModal
                callState={
                    callState
                }
                localStream={
                    localStream ||
                    getLocalStreamRef()
                }
                micOn={micOn}
                cameraOn={
                    cameraOn
                }
                onAccept={
                    acceptCall
                }
                onReject={
                    rejectCall
                }
                onEnd={hangUp}
                onToggleMic={
                    handleToggleMic
                }
                onToggleCamera={
                    handleToggleCamera
                }
            />

        </div>
    );
}