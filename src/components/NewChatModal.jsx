import { useEffect, useState } from "react";
import { getAllUsers } from "../services/userService";

export default function NewChatModal({
                                         onClose,
                                         onUserSelected
                                     }) {
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();

            setUsers(data);

        } catch (error) {
            console.error(
                "USERS ERROR :",
                error
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="
                fixed
                inset-0
                bg-black/40
                flex
                items-center
                justify-center
                z-50
                p-4
            "
        >
            <div
                className="
                    bg-white
                    rounded-xl
                    w-full
                    max-w-md
                    max-h-[80vh]
                    overflow-hidden
                    shadow-xl
                "
            >

                <div
                    className="
                        flex
                        justify-between
                        items-center
                        p-4
                        sm:p-5
                        border-b
                    "
                >
                    <h2 className="text-xl font-bold">
                        New Chat
                    </h2>

                    <button
                        onClick={onClose}
                        className="
                            text-gray-500
                            text-2xl
                            hover:text-black
                        "
                    >
                        ×
                    </button>
                </div>

                <div
                    className="
                        p-4
                        overflow-y-auto
                        max-h-[60vh]
                    "
                >
                    {loading && (
                        <p className="text-gray-500">
                            Loading users...
                        </p>
                    )}

                    {!loading &&
                        users.length === 0 && (
                            <p className="text-gray-500">
                                No users found
                            </p>
                        )}

                    {!loading &&
                        users.map((user) => (

                            <div
                                key={user.id}
                                onClick={() =>
                                    onUserSelected(user)
                                }
                                className="
                                    p-3
                                    mb-2
                                    border
                                    rounded-lg
                                    cursor-pointer
                                    hover:bg-blue-50
                                    active:bg-blue-100
                                "
                            >
                                <p className="font-semibold">
                                    {user.fullName || user.name}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {user.email}
                                </p>
                            </div>

                        ))}
                </div>

            </div>
        </div>
    );
}