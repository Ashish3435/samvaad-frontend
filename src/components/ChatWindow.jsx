import MessageBubble from "./MessageBubble";

export default function ChatWindow({
                                       messages,
                                       bottomRef
                                   }) {
    return (
        <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-3 sm:p-5 space-y-3 sm:space-y-4 bg-slate-50 dark:bg-stone-950">
            {messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    message={message}
                />
            ))}

            <div ref={bottomRef} />
        </div>
    );
}