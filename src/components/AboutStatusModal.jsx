import { useState } from "react";
import { updateAboutStatus } from "../services/userService";

const MAX_LENGTH = 150;

export default function AboutStatusModal({
                                             currentStatus,
                                             onClose,
                                             onUpdated
                                         }) {

    const [text, setText] = useState(currentStatus || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!text.trim()) {
            setError("About status can't be empty.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const updatedProfile = await updateAboutStatus(text.trim());

            onUpdated(updatedProfile);
        } catch (err) {
            console.error("UPDATE ABOUT STATUS ERROR:", err);
            setError("Failed to update status. Try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg w-full max-w-sm p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-stone-100">
                    About Status
                </h3>

                <textarea
                    value={text}
                    onChange={(event) => {
                        setText(event.target.value.slice(0, MAX_LENGTH));
                    }}
                    rows={3}
                    placeholder="Hey there! I'm using Samvaad."
                    className="w-full border dark:border-stone-600 rounded-lg px-3 py-2 outline-none text-sm resize-none bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-400"
                />

                <p className="text-xs text-gray-400 dark:text-stone-500 text-right mt-1">
                    {text.length}/{MAX_LENGTH}
                </p>

                {error && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                        {error}
                    </p>
                )}

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 border dark:border-stone-600 rounded-lg py-2 font-medium text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}