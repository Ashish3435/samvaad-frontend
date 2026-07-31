import { useEffect, useRef } from "react";

export default function ProfileMenu({
                                        onClose,
                                        onSettings,
                                        onUpdatePhoto,
                                        onAboutStatus,
                                        onLogout
                                    }) {

    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-stone-800 border dark:border-stone-700 rounded-lg shadow-lg z-50 py-1"
        >
            <button
                onClick={onSettings}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-stone-100 hover:bg-gray-100 dark:hover:bg-stone-700"
            >
                ⚙️ Settings
            </button>

            <button
                onClick={onUpdatePhoto}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-stone-100 hover:bg-gray-100 dark:hover:bg-stone-700"
            >
                🖼️ Update Photo
            </button>

            <button
                onClick={onAboutStatus}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-stone-100 hover:bg-gray-100 dark:hover:bg-stone-700"
            >
                📝 About Status
            </button>

            <div className="border-t dark:border-stone-700 my-1"></div>

            <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-stone-700 font-medium"
            >
                🚪 Logout
            </button>
        </div>
    );
}