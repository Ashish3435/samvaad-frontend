import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";


const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:8083/chat";


let stompClient = null;


export const connectWebSocket = (

    roomCode,

    onMessage,

    onTyping,

    onSeen

) => {


    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        console.error(
            "No JWT token found"
        );

        return;
    }


    const socket =
        new SockJS(
            SOCKET_URL
        );


    stompClient =
        new Client({

            webSocketFactory:
                () => socket,


            reconnectDelay:
                5000,


            connectHeaders: {

                Authorization:
                    `Bearer ${token}`

            },


            onConnect: () => {


                console.log(
                    "WebSocket Connected"
                );


                /*
                 * NORMAL CHAT MESSAGES
                 */

                stompClient.subscribe(

                    `/topic/${roomCode}`,

                    (message) => {


                        const data =
                            JSON.parse(
                                message.body
                            );


                        onMessage(
                            data
                        );

                    }

                );


                /*
                 * TYPING EVENTS
                 */

                stompClient.subscribe(

                    `/topic/${roomCode}/typing`,

                    (message) => {


                        const data =
                            JSON.parse(
                                message.body
                            );


                        onTyping(
                            data
                        );

                    }

                );


                /*
                 * SEEN EVENTS
                 */

                stompClient.subscribe(

                    `/topic/${roomCode}/seen`,

                    (message) => {


                        const data =
                            JSON.parse(
                                message.body
                            );


                        onSeen(
                            data
                        );

                    }

                );

            },


            onStompError:
                (frame) => {


                    console.error(
                        "STOMP ERROR:",
                        frame
                    );

                },


            onWebSocketError:
                (error) => {


                    console.error(
                        "WEBSOCKET ERROR:",
                        error
                    );

                }

        });


    stompClient.activate();

};


export const sendMessage =
    (message) => {


        if (

            !stompClient ||

            !stompClient.connected

        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        stompClient.publish({

            destination:
                "/app/chat.send",


            body:
                JSON.stringify(
                    message
                )

        });

    };


export const sendTyping =
    (data) => {


        if (

            !stompClient ||

            !stompClient.connected

        ) {

            return;
        }


        stompClient.publish({

            destination:
                "/app/chat.typing",


            body:
                JSON.stringify(
                    data
                )

        });

    };


export const disconnectWebSocket =
    () => {


        if (stompClient) {


            stompClient.deactivate();


            stompClient =
                null;

        }

    };