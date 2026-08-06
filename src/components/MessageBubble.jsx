import { getCurrentUser } from "../services/authService";

const formatFileSize = (base64) => {
    if (!base64) return "";
    const base64Length = base64.split(",")[1]?.length || 0;
    const sizeInBytes = base64Length * 0.75;

    if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type) => {
    if (!type) return "📄";
    if (type.includes("pdf")) return "📕";
    if (type.includes("word") || type.includes("document")) return "📘";
    if (type.includes("text")) return "📃";
    return "📄";
};

export default function MessageBubble({ message }) {
    const currentUser = getCurrentUser()?.trim().toLowerCase();

    const isMe = message.senderEmail?.trim().toLowerCase() === currentUser;

    const isImage = message.attachmentType?.startsWith("image/");
    const hasAttachment = Boolean(message.attachmentData);

    return (
        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
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

                {hasAttachment && isImage && (
                    <a
                        href={message.attachmentData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mb-2 relative group"
                    >
                        <img
                            src={message.attachmentData}
                            alt={message.attachmentName || "Image"}
                            className="rounded-lg max-w-full max-h-72 object-cover"
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-2 py-1 rounded transition-opacity">
                                View full size
                            </span>
                        </span>
                    </a>
                )}

                {hasAttachment && !isImage && (
                    <a
                        href={message.attachmentData}
                        download={message.attachmentName}
                        className={`flex items-center gap-3 mb-2 p-3 rounded-lg border ${
                            isMe
                                ? "bg-white/15 hover:bg-white/25 border-white/20"
                                : "bg-gray-50 dark:bg-stone-700 hover:bg-gray-100 dark:hover:bg-stone-600 border-gray-200 dark:border-stone-600"
                        }`}
                    >
                        <span className="text-3xl shrink-0">
                            {getFileIcon(message.attachmentType)}
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                                {message.attachmentName || "File"}
                            </p>
                            <p
                                className={`text-xs ${
                                    isMe ? "text-white/70" : "text-gray-400 dark:text-stone-400"
                                }`}
                            >
                                {formatFileSize(message.attachmentData)}
                            </p>
                        </div>

                        <span
                            className={`text-xs font-semibold px-2 py-1 rounded shrink-0 ${
                                isMe
                                    ? "bg-white/20"
                                    : "bg-[#993556] text-white"
                            }`}
                        >
                            ⬇ Download
                        </span>
                    </a>
                )}

                {message.content && <p>{message.content}</p>}

                <div
                    className={`flex items-center justify-end gap-1 text-xs mt-2 ${
                        isMe ? "text-pink-100" : "text-gray-400 dark:text-stone-500"
                    }`}
                >
                    <span>
                        {new Date(message.sentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                        })}
                    </span>

                    {isMe && (
                        <span
                            className={
                                message.seen ? "text-white font-bold" : "text-pink-200"
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