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

let callSubscription = null;

/* Runs immediately if already connected, otherwise queues
   until the connection finishes establishing */
const runWhenConnected = (action) => {
    if (isConnected) {
        action();
    } else {
        pendingActions.push(action);
    }
};

/* CONNECT ONCE — call this at login / app start.
   Stays alive across room switches so incoming calls
   and messages can arrive no matter what you're viewing. */
export const connectWebSocket = (onCallSignal) => {

    if (stompClient) {
        // already connected or connecting
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        console.error("No JWT token found");
        return;
    }

    const socket = new SockJS(SOCKET_URL);

    stompClient = new Client({

        webSocketFactory: () => socket,

        reconnectDelay: 5000,

        connectHeaders: {
            Authorization: `Bearer ${token}`
        },

        onConnect: () => {

            console.log("WebSocket Connected");

            isConnected = true;

            /* GLOBAL CALL SIGNAL SUBSCRIPTION —
               works regardless of which room is currently open */
            callSubscription = stompClient.subscribe(
                "/user/queue/call",
                (message) => {
                    const data = JSON.parse(message.body);
                    if (onCallSignal) {
                        onCallSignal(data);
                    }
                }
            );

            /* FLUSH ANYTHING THAT WAS WAITING ON CONNECTION
               (e.g. an initial room subscription requested
               before the socket finished connecting) */
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

/* SWITCH ROOM — unsubscribes previous room's topics,
   subscribes to the new room's topics. Does NOT disconnect
   or reconnect the underlying socket. */
export const subscribeToRoom = (
    roomCode,
    onMessage,
    onTyping,
    onSeen
) => {

    const doSubscribe = () => {

        /* UNSUBSCRIBE PREVIOUS ROOM'S TOPICS FIRST */
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

    runWhenConnected(doSubscribe);
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
        console.error("WebSocket is not connected");
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

/* CALL SIGNALING — invite / accept / reject / end /
   webrtc offer / answer / ice candidate all go through this */
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

/* FULL TEARDOWN — call this at logout only */
export const disconnectWebSocket = () => {

    unsubscribeFromRoom();

    if (callSubscription) {
        callSubscription.unsubscribe();
        callSubscription = null;
    }

    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }

    isConnected = false;
    pendingActions = [];
};