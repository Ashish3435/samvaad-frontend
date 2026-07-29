import { useEffect, useRef, useState } from "react";
import { sendTyping } from "../services/websocket";

export default function ChatInput({
                                      onSend,
                                      roomCode
                                  }) {
    const [text, setText] = useState("");

    const typingTimeout = useRef(null);

    const handleChange = (event) => {
        const value = event.target.value;

        setText(value);

        if (!roomCode) {
            return;
        }

        sendTyping({
            roomCode,
            typing: true
        });

        clearTimeout(typingTimeout.current);

        typingTimeout.current = setTimeout(() => {
            sendTyping({
                roomCode,
                typing: false
            });
        }, 4000);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!text.trim()) {
            return;
        }

        onSend(text);

        setText("");

        clearTimeout(typingTimeout.current);

        sendTyping({
            roomCode,
            typing: false
        });
    };

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeout.current);
        };
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white border-t p-2 sm:p-4 flex gap-2 sm:gap-3 shrink-0"
        >
            <input
                type="text"
                value={text}
                onChange={handleChange}
                placeholder="Type a message..."
                className="flex-1 min-w-0 border rounded-lg px-3 sm:px-4 py-3 outline-none text-base"
            />
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold shrink-0"
            >
                Send
            </button>
        </form>
    );
}