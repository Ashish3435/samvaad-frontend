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


export default function Chat() {

    const navigate = useNavigate();
    const bottomRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [typingUser, setTypingUser] = useState("");
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    const [callState, setCallState] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);

    const currentUserEmail = getCurrentUser()?.trim().toLowerCase();

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

    const loadRooms = useCallback(async () => {
        try {
            const data = await getRooms();
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

    const loadMessages = useCallback(async (roomCode) => {
        try {
            const data = await getMessages(roomCode);
            setMessages(data);
        } catch (error) {
            console.error("MESSAGE ERROR:", error);
        }
    }, []);

    const loadOnlineUsers = useCallback(async () => {
        try {
            const data = await getOnlineUsers();
            setOnlineUsers(data);
        } catch (error) {
            console.error("ONLINE USERS ERROR:", error);
        }
    }, []);

    const findMemberName = useCallback(
        (email) => {
            for (const room of rooms) {
                const member = room.members?.find(
                    (m) => m.email?.trim().toLowerCase() === email
                );
                if (member) {
                    return member.fullName;
                }
            }
            return email;
        },
        [rooms]
    );

    const handleCallSignal = useCallback(async (data) => {

        switch (data.type) {

            case "call-invite": {
                setCallState((prev) => {
                    if (prev) {
                        return prev;
                    }
                    return {
                        status: "ringing-incoming",
                        roomCode: data.roomCode,
                        callType: data.callType,
                        callerEmail: data.targetEmail,
                        callerName: findMemberName(data.targetEmail),
                        participants: {}
                    };
                });
                break;
            }

            case "call-accept": {
                const acceptorEmail = data.targetEmail;

                setCallState((prev) => {
                    if (!prev || prev.status !== "ringing-outgoing") {
                        return prev;
                    }

                    const existingPeers = Object.keys(prev.participants);

                    sendCallSignal({
                        type: "call-peers-list",
                        roomCode: prev.roomCode,
                        targetEmail: acceptorEmail,
                        payload: { peers: [currentUserEmail, ...existingPeers] }
                    });

                    return {
                        ...prev,
                        status: "in-call",
                        participants: {
                            ...prev.participants,
                            [acceptorEmail]: {
                                name: findMemberName(acceptorEmail),
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
                const peers = data.payload?.peers || [];
                for (const peerEmail of peers) {
                    await createOfferTo(peerEmail);
                }
                break;
            }

            case "webrtc-offer": {
                await handleOffer(data.targetEmail, data.payload);

                setCallState((prev) => {
                    if (!prev) {
                        return prev;
                    }
                    return {
                        ...prev,
                        participants: {
                            ...prev.participants,
                            [data.targetEmail]:
                                prev.participants[data.targetEmail] || {
                                    name: findMemberName(data.targetEmail),
                                    stream: null
                                }
                        }
                    };
                });
                break;
            }

            case "webrtc-answer": {
                await handleAnswer(data.targetEmail, data.payload);
                break;
            }

            case "webrtc-ice-candidate": {
                await handleIceCandidate(data.targetEmail, data.payload);
                break;
            }

            default:
                break;
        }

    }, [currentUserEmail, findMemberName]);

    useEffect(() => {
        initWebRTC({
            sendSignalFn: sendCallSignal,
            onRemoteStreamFn: (peerEmail, stream) => {
                setCallState((prev) => {
                    if (!prev) {
                        return prev;
                    }
                    return {
                        ...prev,
                        participants: {
                            ...prev.participants,
                            [peerEmail]: {
                                ...(prev.participants[peerEmail] || { name: peerEmail }),
                                stream
                            }
                        }
                    };
                });
            },
            onPeerLeftFn: (peerEmail) => {
                setCallState((prev) => {
                    if (!prev) {
                        return prev;
                    }
                    const updated = { ...prev.participants };
                    delete updated[peerEmail];
                    return { ...prev, participants: updated };
                });
            }
        });
    }, []);

    useEffect(() => {
        connectWebSocket(handleCallSignal);

        loadRooms();
        loadOnlineUsers();

        const interval = setInterval(loadOnlineUsers, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [loadRooms, loadOnlineUsers, handleCallSignal]);

    useEffect(() => {
        if (!selectedRoom) {
            return;
        }

        setMessages([]);
        setTypingUser("");

        loadMessages(selectedRoom);

        markMessagesAsSeen(selectedRoom).catch((error) => {
            console.error("MARK SEEN ERROR:", error);
        });

        subscribeToRoom(
            selectedRoom,

            (message) => {
                setMessages((previousMessages) => {
                    return [...previousMessages, message];
                });

                if (
                    message.senderEmail?.trim().toLowerCase() !==
                    currentUserEmail
                ) {
                    markMessagesAsSeen(selectedRoom).catch((error) => {
                        console.error("MARK SEEN ERROR:", error);
                    });
                }
            },

            (typingData) => {
                const typingEmail = typingData.email?.trim().toLowerCase();

                if (typingEmail === currentUserEmail) {
                    return;
                }

                setTypingUser(typingData.typing ? typingEmail : "");
            },

            (seenData) => {
                setMessages((previousMessages) => {
                    return previousMessages.map((message) => {
                        if (
                            message.senderEmail?.trim().toLowerCase() ===
                            currentUserEmail &&
                            message.roomCode === seenData.roomCode
                        ) {
                            return { ...message, seen: true };
                        }
                        return message;
                    });
                });
            }
        );

    }, [selectedRoom, loadMessages, currentUserEmail]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (text) => {
        if (!text || !text.trim() || !selectedRoom) {
            return;
        }

        sendMessage({
            roomCode: selectedRoom,
            content: text
        });
    };

    const handleRoomCreated = async (newRoom) => {
        try {
            const updatedRooms = await getRooms();
            setRooms(updatedRooms);
            setSelectedRoom(newRoom.roomCode);
        } catch (error) {
            console.error("ROOM REFRESH ERROR:", error);
        }
    };

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

    const handleRoomUpdated = (updatedRoom) => {
        setRooms((previousRooms) =>
            previousRooms.map((room) =>
                room.roomCode === updatedRoom.roomCode ? updatedRoom : room
            )
        );
    };

    const handleLogout = () => {
        endCall();
        disconnectWebSocket();
        logout();
        navigate("/login");
    };

    const startCall = async (callType) => {
        if (callState || !selectedRoom) {
            return;
        }

        try {
            const stream = await getLocalStream(callType);
            setLocalStream(stream);
            setMicOn(true);
            setCameraOn(callType === "video");

            sendCallSignal({
                type: "call-invite",
                roomCode: selectedRoom,
                callType
            });

            setCallState({
                status: "ringing-outgoing",
                roomCode: selectedRoom,
                callType,
                participants: {}
            });
        } catch (error) {
            console.error("CALL START ERROR:", error);
            alert("Could not access microphone/camera.");
        }
    };

    const acceptCall = async () => {
        if (!callState) {
            return;
        }

        try {
            const stream = await getLocalStream(callState.callType);
            setLocalStream(stream);
            setMicOn(true);
            setCameraOn(callState.callType === "video");

            sendCallSignal({
                type: "call-accept",
                roomCode: callState.roomCode,
                targetEmail: callState.callerEmail
            });

            setCallState((prev) => ({ ...prev, status: "in-call" }));
        } catch (error) {
            console.error("CALL ACCEPT ERROR:", error);
            alert("Could not access microphone/camera.");
        }
    };

    const rejectCall = () => {
        if (!callState) {
            return;
        }

        sendCallSignal({
            type: "call-reject",
            roomCode: callState.roomCode,
            targetEmail: callState.callerEmail
        });

        setCallState(null);
    };

    const hangUp = () => {
        if (!callState) {
            return;
        }

        sendCallSignal({
            type: "call-end",
            roomCode: callState.roomCode
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

    const selectedRoomData = rooms.find(
        (room) => room.roomCode === selectedRoom
    );

    const selectedRoomType = selectedRoomData?.roomType;

    const displayRoomName =
        selectedRoomType === "CHAT" && selectedRoomData?.otherUserName
            ? selectedRoomData.otherUserName
            : selectedRoomData?.roomName || selectedRoom;

    const isOpponentOnline =
        selectedRoomData?.otherUserEmail
            ? onlineUsers.some(
                (user) =>
                    user.email?.trim().toLowerCase() ===
                    selectedRoomData.otherUserEmail?.trim().toLowerCase()
            )
            : false;

    const typingDisplayName =
        typingUser &&
        selectedRoomData?.otherUserEmail?.trim().toLowerCase() === typingUser
            ? selectedRoomData.otherUserName
            : typingUser;

    const canSend =
        selectedRoomType === "CHANNEL"
            ? Boolean(selectedRoomData?.isAdmin)
            : true;

    const isGroupOrChannel =
        selectedRoomType === "GROUP" || selectedRoomType === "CHANNEL";

    const canCall =
        !callState &&
        selectedRoom &&
        (selectedRoomType === "CHAT" || selectedRoomType === "GROUP");

    return (
        <div
            className="flex bg-slate-100 dark:bg-stone-950 overflow-hidden"
            style={{ height: `${viewportHeight}px` }}
        >
            <Sidebar
                rooms={rooms}
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
                onlineUsers={onlineUsers}
                onLogout={handleLogout}
                onRoomCreated={handleRoomCreated}
                onNewChat={() => setShowNewChat(true)}
                currentUserEmail={currentUserEmail}
            />

            <div
                className={`${
                    selectedRoom ? "flex" : "hidden md:flex"
                } flex-1 flex-col min-w-0`}
            >
                <div className="bg-white dark:bg-stone-900 border-b dark:border-stone-700 px-5 py-3 flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => setSelectedRoom("")}
                        className="md:hidden text-blue-600 dark:text-teal-400 font-bold text-xl px-1"
                    >
                        ←
                    </button>

                    <button
                        onClick={() => {
                            if (isGroupOrChannel) {
                                setShowGroupInfo(true);
                            }
                        }}
                        className={`flex-1 min-w-0 text-left ${
                            isGroupOrChannel ? "cursor-pointer" : "cursor-default"
                        }`}
                    >
                        <h2 className="text-xl font-bold truncate text-gray-900 dark:text-stone-100">
                            {displayRoomName}
                        </h2>

                        {typingUser ? (
                            <p className="text-sm text-green-600 dark:text-green-400">
                                {typingDisplayName} is typing...
                            </p>
                        ) : isGroupOrChannel ? (
                            <p className="text-sm text-gray-400 dark:text-stone-500">
                                {selectedRoomData?.members?.length || 0} members
                            </p>
                        ) : (
                            selectedRoomType === "CHAT" &&
                            selectedRoomData?.otherUserEmail && (
                                <p
                                    className={`text-sm ${
                                        isOpponentOnline
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-gray-400 dark:text-stone-500"
                                    }`}
                                >
                                    <span className="mr-1">●</span>
                                    {isOpponentOnline ? "Online" : "Offline"}
                                </p>
                            )
                        )}
                    </button>

                    {canCall && (
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={() => startCall("audio")}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800"
                                aria-label="Voice call"
                            >
                                📞
                            </button>

                            <button
                                onClick={() => startCall("video")}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800"
                                aria-label="Video call"
                            >
                                🎥
                            </button>
                        </div>
                    )}
                </div>

                <ChatWindow messages={messages} bottomRef={bottomRef} />

                <ChatInput
                    onSend={handleSend}
                    roomCode={selectedRoom}
                    canSend={canSend}
                />
            </div>

            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onUserSelected={handleUserSelected}
                />
            )}

            {showGroupInfo && selectedRoomData && (
                <GroupInfoModal
                    room={selectedRoomData}
                    currentUserEmail={currentUserEmail}
                    onClose={() => setShowGroupInfo(false)}
                    onUpdated={handleRoomUpdated}
                />
            )}

            <CallModal
                callState={callState}
                localStream={localStream || getLocalStreamRef()}
                micOn={micOn}
                cameraOn={cameraOn}
                onAccept={acceptCall}
                onReject={rejectCall}
                onEnd={hangUp}
                onToggleMic={handleToggleMic}
                onToggleCamera={handleToggleCamera}
            />
        </div>
    );
}