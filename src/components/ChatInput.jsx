import { useEffect, useRef, useState } from "react";
import { sendTyping } from "../services/websocket";

export default function ChatInput({
                                      onSend,
                                      roomCode,
                                      canSend = true
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

    if (!canSend) {
        return (
            <div className="bg-white dark:bg-stone-800 border-t dark:border-stone-700 p-4 shrink-0 text-center">
                <p className="text-sm text-gray-400 dark:text-stone-500">
                    Only admins can send messages in this channel.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-stone-800 border-t dark:border-stone-700 p-2 sm:p-4 flex gap-2 sm:gap-3 shrink-0"
        >
            <input
                type="text"
                value={text}
                onChange={handleChange}
                placeholder="Type a message..."
                className="flex-1 min-w-0 border dark:border-stone-600 rounded-lg px-3 sm:px-4 py-3 outline-none text-base bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-400"
            />
            <button
                type="submit"
                className="bg-[#993556] text-white px-4 sm:px-6 py-3 rounded-lg font-semibold shrink-0 hover:bg-[#7a2b46]"
            >
                Send
            </button>
        </form>
    );
}