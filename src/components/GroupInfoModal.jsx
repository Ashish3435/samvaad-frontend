import { useEffect, useState } from "react";
import { getAllUsers } from "../services/userService";
import {
    addMember,
    removeMember,
    promoteToAdmin
} from "../services/roomService";

export default function GroupInfoModal({
                                           room,
                                           currentUserEmail,
                                           onClose,
                                           onUpdated
                                       }) {

    const [showAddPanel, setShowAddPanel] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [error, setError] = useState("");
    const [busyEmail, setBusyEmail] = useState(null);

    const isChannel = room.roomType === "CHANNEL";

    useEffect(() => {
        if (showAddPanel) {
            loadUsers();
        }
    }, [showAddPanel]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = await getAllUsers();
            setAllUsers(data);
        } catch (err) {
            console.error("LOAD USERS ERROR:", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const memberEmails = room.members.map(
        (member) => member.email?.trim().toLowerCase()
    );

    const availableUsers = allUsers.filter(
        (user) =>
            !memberEmails.includes(
                user.email?.trim().toLowerCase()
            )
    );

    const handleAddMember = async (email) => {
        try {
            setError("");
            setBusyEmail(email);

            const updatedRoom = await addMember(room.roomCode, email);

            onUpdated(updatedRoom);
        } catch (err) {
            console.error("ADD MEMBER ERROR:", err);
            setError("Failed to add member.");
        } finally {
            setBusyEmail(null);
        }
    };

    const handleRemoveMember = async (email) => {
        try {
            setError("");
            setBusyEmail(email);

            const updatedRoom = await removeMember(room.roomCode, email);

            onUpdated(updatedRoom);
        } catch (err) {
            console.error("REMOVE MEMBER ERROR:", err);
            setError("Failed to remove member.");
        } finally {
            setBusyEmail(null);
        }
    };

    const handlePromote = async (email) => {
        try {
            setError("");
            setBusyEmail(email);

            const updatedRoom = await promoteToAdmin(room.roomCode, email);

            onUpdated(updatedRoom);
        } catch (err) {
            console.error("PROMOTE ERROR:", err);
            setError("Failed to promote member.");
        } finally {
            setBusyEmail(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">

                <div className="p-5 border-b dark:border-stone-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100">
                            {room.roomName}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-stone-500">
                            {isChannel ? "Channel" : "Group"} · {room.members.length} members
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-stone-400 text-2xl hover:text-black dark:hover:text-stone-100"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">

                    {isChannel && (
                        <p className="text-xs text-gray-400 dark:text-stone-500 mb-3 italic">
                            Only admins can post in this channel.
                        </p>
                    )}

                    {error && (
                        <p className="text-red-600 dark:text-red-400 text-sm mb-3">
                            {error}
                        </p>
                    )}

                    <div className="space-y-2 mb-4">
                        {room.members.map((member) => {
                            const isMemberBusy = busyEmail === member.email;
                            const isSelf =
                                member.email?.trim().toLowerCase() ===
                                currentUserEmail;

                            return (
                                <div
                                    key={member.email}
                                    className="flex items-center justify-between p-2 rounded-lg border dark:border-stone-700"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-gray-900 dark:text-stone-100 truncate">
                                            {member.fullName}
                                            {isSelf && " (You)"}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-stone-500 truncate">
                                            {member.email}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        {member.admin && (
                                            <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                                                Admin
                                            </span>
                                        )}

                                        {room.admin && !member.admin && (
                                            <button
                                                onClick={() => handlePromote(member.email)}
                                                disabled={isMemberBusy}
                                                className="text-xs text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50"
                                            >
                                                Make admin
                                            </button>
                                        )}

                                        {room.admin && !isSelf && (
                                            <button
                                                onClick={() => handleRemoveMember(member.email)}
                                                disabled={isMemberBusy}
                                                className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {room.admin && (
                        <div>
                            {!showAddPanel ? (
                                <button
                                    onClick={() => setShowAddPanel(true)}
                                    className="w-full border dark:border-stone-600 rounded-lg py-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-stone-700"
                                >
                                    + Add Member
                                </button>
                            ) : (
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-stone-100 mb-2">
                                        Select a user to add
                                    </p>

                                    {loadingUsers && (
                                        <p className="text-sm text-gray-400 dark:text-stone-500">
                                            Loading users...
                                        </p>
                                    )}

                                    {!loadingUsers && availableUsers.length === 0 && (
                                        <p className="text-sm text-gray-400 dark:text-stone-500">
                                            No more users to add.
                                        </p>
                                    )}

                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {availableUsers.map((user) => (
                                            <div
                                                key={user.email}
                                                onClick={() => handleAddMember(user.email)}
                                                className="p-2 rounded-lg cursor-pointer hover:bg-teal-50 dark:hover:bg-stone-700 text-sm text-gray-900 dark:text-stone-100"
                                            >
                                                {user.fullName || user.name}
                                                <span className="text-xs text-gray-400 dark:text-stone-500 ml-2">
                                                    {user.email}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setShowAddPanel(false)}
                                        className="w-full text-center text-xs text-gray-400 dark:text-stone-500 mt-2 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}