export default function OnlineUsers({

                                        users = [],

                                        currentUserEmail,

                                        selectedRoomUserEmail

                                    }) {

    const visibleUsers =
        selectedRoomUserEmail
            ? users.filter(
                (user) =>
                    user.email ===
                    selectedRoomUserEmail
            )
            : users.filter(
                (user) =>
                    user.email !==
                    currentUserEmail
            );

    return (

        <div>
            <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-stone-100">
                Online Users
            </h3>

            <div className="space-y-2">
                {visibleUsers.length === 0 ? (

                    <p className="text-gray-400 dark:text-stone-500">
                        No online users
                    </p>

                ) : (

                    visibleUsers.map((user) => (

                        <div
                            key={user.email}

                            className="flex items-center gap-3 bg-white dark:bg-stone-800 border dark:border-stone-700 rounded-lg p-3 shadow-sm text-gray-900 dark:text-stone-100"
                        >
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>
                                {user.fullName}
                            </span>
                        </div>
                    ))

                )}

            </div>
        </div>
    );

}