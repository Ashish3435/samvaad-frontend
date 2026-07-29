import { useState } from "react";

export default function CreateChannelModal({

                                               onClose,
                                               onCreate

                                           }) {

    const [roomName, setRoomName] = useState("");

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white rounded-xl p-6 w-96">

                <h2 className="text-xl font-bold mb-5">

                    Create Channel

                </h2>

                <input
                    type="text"
                    placeholder="Channel Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="border rounded-lg w-full p-3 mb-5"
                />

                <div className="flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => onCreate(roomName)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                        Create
                    </button>

                </div>

            </div>

        </div>

    );

}