import { useState } from "react";
import { updateProfilePhoto } from "../services/userService";

export default function UpdatePhotoModal({
                                             currentPhoto,
                                             onClose,
                                             onUpdated
                                         }) {

    const [preview, setPreview] = useState(currentPhoto || null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    /* RESIZE + COMPRESS IMAGE BEFORE CONVERTING TO BASE64
       (keeps DB rows small and uploads fast, since we're
       storing images directly as base64 text) */
    const resizeImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();

                img.onload = () => {
                    const maxSize = 300;

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

                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };

                img.onerror = () => reject(new Error("Invalid image"));
                img.src = event.target.result;
            };

            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            return;
        }

        try {
            setError("");
            const resizedBase64 = await resizeImage(file);
            setPreview(resizedBase64);
        } catch (err) {
            console.error("IMAGE RESIZE ERROR:", err);
            setError("Could not process that image. Try another one.");
        }
    };

    const handleSave = async () => {
        if (!preview) {
            setError("Please choose a photo first.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const updatedProfile = await updateProfilePhoto(preview);

            onUpdated(updatedProfile);
        } catch (err) {
            console.error("UPDATE PHOTO ERROR:", err);
            setError("Failed to update photo. Try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg w-full max-w-sm p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-stone-100">
                    Update Profile Photo
                </h3>

                <div className="flex justify-center mb-4">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-28 h-28 rounded-full object-cover border dark:border-stone-600"
                        />
                    ) : (
                        <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-stone-700 flex items-center justify-center text-gray-400 dark:text-stone-400 text-sm">
                            No photo
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm mb-3 text-gray-700 dark:text-stone-300"
                />

                {error && (
                    <p className="text-red-600 dark:text-red-400 text-sm mb-3">
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