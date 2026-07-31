import { getCurrentUser } from "../services/authService";

export default function MessageBubble({ message }) {
    const currentUser = getCurrentUser()?.trim().toLowerCase();

    const isMe = message.senderEmail?.trim().toLowerCase() === currentUser;

    return (
        <div
            className={`flex ${
                isMe ? "justify-end" : "justify-start"
            }`}
        >
            <div
                className={`max-w-md rounded-2xl px-4 py-3 shadow ${
                    isMe
                        ? "bg-gradient-to-br from-[#7F77DD] to-[#D4537E] text-white"
                        : "bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100"
                }`}
            >
                {!isMe && (
                    <p className="font-bold text-blue-600 dark:text-teal-400 mb-1">
                        {message.senderName}
                    </p>
                )}

                <p>
                    {message.content}
                </p>

                <div
                    className={`flex items-center justify-end gap-1 text-xs mt-2 ${
                        isMe
                            ? "text-pink-100"
                            : "text-gray-400 dark:text-stone-500"
                    }`}
                >
                    <span>
                        {new Date(
                            message.sentAt
                        ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>

                    {isMe && (
                        <span
                            className={
                                message.seen
                                    ? "text-white font-bold"
                                    : "text-pink-200"
                            }
                        >
                            {message.seen ? "✓✓" : "✓"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}