import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:8083/chat";

let stompClient = null;
let isConnected = false;
let pendingActions = [];

let roomSubscriptions = {
    message: null,
    typing: null,
    seen: null
};

let currentRoomHandlers = null;

let callSubscription = null;
let notificationSubscription = null;

const runWhenConnected = (action) => {
    if (isConnected && stompClient?.connected) {
        action();
    } else {
        pendingActions.push(action);
    }
};

export const connectWebSocket = (onCallSignal, onNotification) => {

    if (stompClient) {
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        console.error("No JWT token found");
        return;
    }

    stompClient = new Client({

        webSocketFactory: () =>
            new SockJS(SOCKET_URL, null, {
                transports: ["websocket"]
            }),

        reconnectDelay: 5000,

        connectHeaders: {
            Authorization: `Bearer ${token}`
        },

        onConnect: () => {


            isConnected = true;

            callSubscription = stompClient.subscribe(
                "/user/queue/call",
                (message) => {
                    const data = JSON.parse(message.body);
                    if (onCallSignal) {
                        onCallSignal(data);
                    }
                }
            );

            notificationSubscription = stompClient.subscribe(
                "/user/queue/notifications",
                (message) => {
                    const data = JSON.parse(message.body);
                    if (onNotification) {
                        onNotification(data);
                    }
                }
            );

            if (currentRoomHandlers) {
                doSubscribeToRoom(
                    currentRoomHandlers.roomCode,
                    currentRoomHandlers.onMessage,
                    currentRoomHandlers.onTyping,
                    currentRoomHandlers.onSeen
                );
            }

            pendingActions.forEach((action) => action());
            pendingActions = [];
        },

        onDisconnect: () => {
            isConnected = false;
        },

        onStompError: (frame) => {
            console.error("STOMP ERROR:", frame);
        },

        onWebSocketError: (error) => {
            console.error("WEBSOCKET ERROR:", error);
        }
    });

    stompClient.activate();
};

const doSubscribeToRoom = (
    roomCode,
    onMessage,
    onTyping,
    onSeen
) => {

    unsubscribeFromRoom();

    roomSubscriptions.message = stompClient.subscribe(
        `/topic/${roomCode}`,
        (message) => {
            const data = JSON.parse(message.body);
            onMessage(data);
        }
    );

    roomSubscriptions.typing = stompClient.subscribe(
        `/topic/${roomCode}/typing`,
        (message) => {
            const data = JSON.parse(message.body);
            onTyping(data);
        }
    );

    roomSubscriptions.seen = stompClient.subscribe(
        `/topic/${roomCode}/seen`,
        (message) => {
            const data = JSON.parse(message.body);
            onSeen(data);
        }
    );
};

export const subscribeToRoom = (
    roomCode,
    onMessage,
    onTyping,
    onSeen
) => {

    currentRoomHandlers = { roomCode, onMessage, onTyping, onSeen };

    runWhenConnected(() => {
        try {
            doSubscribeToRoom(roomCode, onMessage, onTyping, onSeen);
        } catch (error) {
            console.error("ROOM SUBSCRIBE ERROR:", error);
        }
    });
};

export const unsubscribeFromRoom = () => {

    if (roomSubscriptions.message) {
        roomSubscriptions.message.unsubscribe();
        roomSubscriptions.message = null;
    }

    if (roomSubscriptions.typing) {
        roomSubscriptions.typing.unsubscribe();
        roomSubscriptions.typing = null;
    }

    if (roomSubscriptions.seen) {
        roomSubscriptions.seen.unsubscribe();
        roomSubscriptions.seen = null;
    }
};

export const sendMessage = (message) => {



    if (!stompClient || !stompClient.connected) {
        console.warn("WebSocket not connected yet, retrying shortly...");

        setTimeout(() => {


            if (stompClient && stompClient.connected) {
                stompClient.publish({
                    destination: "/app/chat.send",
                    body: JSON.stringify(message)
                });
            } else {
                console.error("WebSocket still not connected, message not sent");
            }
        }, 1500);

        return;
    }

    stompClient.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(message)
    });

};

export const sendTyping = (data) => {

    if (!stompClient || !stompClient.connected) {
        return;
    }

    stompClient.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify(data)
    });
};

export const sendCallSignal = (signal) => {

    if (!stompClient || !stompClient.connected) {
        console.error("WebSocket is not connected");
        return;
    }

    stompClient.publish({
        destination: "/app/call.signal",
        body: JSON.stringify(signal)
    });
};

export const disconnectWebSocket = () => {

    unsubscribeFromRoom();

    currentRoomHandlers = null;

    if (callSubscription) {
        callSubscription.unsubscribe();
        callSubscription = null;
    }

    if (notificationSubscription) {
        notificationSubscription.unsubscribe();
        notificationSubscription = null;
    }

    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }

    isConnected = false;
    pendingActions = [];
};