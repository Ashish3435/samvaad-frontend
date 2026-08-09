import { useEffect, useRef, useState } from "react";
import { sendTyping } from "../services/websocket";

const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;

const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                const maxSize = 1000;

                let { width, height } = img;

                if (width > height && width > maxSize) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL("image/jpeg", 0.6));
            };

            img.onerror = () => reject(new Error("Invalid image"));
            img.src = event.target.result;
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
};

const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
};

export default function ChatInput({
                                      onSend,
                                      roomCode,
                                      canSend = true
                                  }) {
    const [text, setText] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [attachError, setAttachError] = useState("");
    const [processingFile, setProcessingFile] = useState(false);

    const typingTimeout = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        event.target.value = "";
        setAttachError("");
        setProcessingFile(true);


        try {
            if (file.type.startsWith("image/")) {
                const resizedBase64 = await resizeImage(file);
                setAttachment({
                    data: resizedBase64,
                    type: "image/jpeg",
                    name: file.name
                });

            } else {
                if (file.size > MAX_DOCUMENT_SIZE) {
                    setAttachError("File too large. Max 2MB.");
                    setProcessingFile(false);
                    return;
                }

                const base64 = await readFileAsBase64(file);
                setAttachment({
                    data: base64,
                    type: file.type || "application/octet-stream",
                    name: file.name
                });

            }
        } catch (error) {
            console.error("ATTACHMENT ERROR:", error);
            setAttachError("Could not process that file.");
        } finally {
            setProcessingFile(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();



        if (!text.trim() && !attachment) {
            return;
        }

        onSend(text, attachment);

        setText("");
        setAttachment(null);
        setAttachError("");

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
        <div className="bg-white dark:bg-stone-800 border-t dark:border-stone-700 shrink-0">
            {(attachment || attachError) && (
                <div className="px-3 sm:px-4 pt-2 flex items-center gap-2">
                    {attachment && (
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-stone-700 rounded-lg px-2 py-1.5">
                            {attachment.type.startsWith("image/") ? (
                                <img
                                    src={attachment.data}
                                    alt="Preview"
                                    className="w-10 h-10 rounded object-cover"
                                />
                            ) : (
                                <span className="text-xl">📄</span>
                            )}

                            <span className="text-xs text-gray-700 dark:text-stone-300 max-w-[140px] truncate">
                                {attachment.name}
                            </span>

                            <button
                                onClick={() => setAttachment(null)}
                                className="text-gray-400 dark:text-stone-400 hover:text-red-500 text-sm px-1"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {attachError && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                            {attachError}
                        </span>
                    )}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="p-2 sm:p-4 flex gap-2 sm:gap-3 items-center"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processingFile}
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-700 disabled:opacity-50"
                    aria-label="Attach file"
                >
                    📎
                </button>

                <input
                    type="text"
                    value={text}
                    onChange={handleChange}
                    placeholder="Type a message..."
                    className="flex-1 min-w-0 border dark:border-stone-600 rounded-lg px-3 sm:px-4 py-3 outline-none text-base bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-400"
                />

                <button
                    type="submit"
                    disabled={processingFile}
                    className="bg-[#993556] text-white px-4 sm:px-6 py-3 rounded-lg font-semibold shrink-0 hover:bg-[#7a2b46] disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
}