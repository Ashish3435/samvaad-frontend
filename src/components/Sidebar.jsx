import RoomList from "./RoomList";
import OnlineUsers from "./OnlineUsers";

export default function Sidebar({
                                    rooms = [],
                                    selectedRoom,
                                    onSelectRoom,
                                    onlineUsers = [],
                                    onLogout,
                                    onRoomCreated,
                                    onNewChat,
                                    currentUserEmail
                                }) {

    const chats = rooms.filter((room) => room.roomType === "CHAT");
    const groups = rooms.filter((room) => room.roomType === "GROUP");
    const channels = rooms.filter((room) => room.roomType === "CHANNEL");

    const selectedRoomData = rooms.find(
        (room) => room.roomCode === selectedRoom
    );

    return (
        <div
            className={`${
                selectedRoom ? "hidden md:flex" : "flex"
            } w-full md:w-80 bg-white border-r flex-col`}
        >
            <div className="p-5 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-600">
                    Samvaad
                </h2>
                <button
                    onClick={onLogout}
                    className="text-red-500 font-semibold hover:text-red-700"
                >
                    Logout
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <RoomList
                    title="💬 Chats"
                    rooms={chats}
                    selectedRoom={selectedRoom}
                    onSelectRoom={onSelectRoom}
                    onNewChat={onNewChat}
                    onRoomCreated={onRoomCreated}
                />

                <div className="my-5 border-t"></div>

                <RoomList
                    title="👥 Groups"
                    rooms={groups}
                    selectedRoom={selectedRoom}
                    onSelectRoom={onSelectRoom}
                    onRoomCreated={onRoomCreated}
                />

                <div className="my-5 border-t"></div>

                <RoomList
                    title="📢 Channels"
                    rooms={channels}
                    selectedRoom={selectedRoom}
                    onSelectRoom={onSelectRoom}
                    onRoomCreated={onRoomCreated}
                />

                <div className="my-5 border-t"></div>

                <OnlineUsers
                    users={onlineUsers}
                    currentUserEmail={currentUserEmail}
                    selectedRoomUserEmail={selectedRoomData?.otherUserEmail}
                />
            </div>
        </div>
    );
}