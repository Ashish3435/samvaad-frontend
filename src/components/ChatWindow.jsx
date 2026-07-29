import MessageBubble from "./MessageBubble";

export default function ChatWindow({
                                       messages,
                                       bottomRef,
                                   }) {
    return (
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4">
            {messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    message={message}
                />
            ))}

            <div ref={bottomRef}></div>
        </div>
    );
}