import { useState } from "react";

export default function CreateChannelModal({

                                               onClose,
                                               onCreate

                                           }) {

    const [roomName, setRoomName] = useState("");

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-stone-800 rounded-xl p-6 w-96">
                <h2 className="text-xl font-bold mb-5 text-gray-900 dark:text-stone-100">
                    Create Channel
                </h2>

                <input
                    type="text"
                    placeholder="Channel Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="border dark:border-stone-600 rounded-lg w-full p-3 mb-5 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-400"
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border dark:border-stone-600 rounded-lg text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => onCreate(roomName)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}