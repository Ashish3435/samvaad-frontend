import { useTheme } from "../context/ThemeContext";

export default function SettingsModal({
                                          profile,
                                          onClose
                                      }) {

    const { theme, toggleTheme } = useTheme();

    const getInitials = (name) => {
        if (!name) {
            return "?";
        }
        return name
            .trim()
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg w-full max-w-sm p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-stone-100">
                    Settings
                </h3>

                <div className="flex flex-col items-center mb-5">
                    {profile?.profileImageBase64 ? (
                        <img
                            src={profile.profileImageBase64}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border dark:border-stone-600 mb-3"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xl mb-3">
                            {getInitials(profile?.fullName)}
                        </div>
                    )}

                    <p className="font-bold text-lg text-gray-900 dark:text-stone-100">
                        {profile?.fullName || "—"}
                    </p>

                    <p className="text-gray-500 dark:text-stone-400 text-sm">
                        {profile?.email || "—"}
                    </p>

                    {profile?.aboutStatus && (
                        <p className="text-gray-600 dark:text-stone-300 text-sm mt-2 text-center italic">
                            "{profile.aboutStatus}"
                        </p>
                    )}
                </div>

                <div className="border-t dark:border-stone-700 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                                Appearance
                            </p>
                            <p className="text-xs text-gray-400 dark:text-stone-500">
                                {theme === "dark" ? "Dark mode" : "Light mode"}
                            </p>
                        </div>

                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle dark mode"
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                theme === "dark" ? "bg-teal-500" : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform flex items-center justify-center text-xs ${
                                    theme === "dark" ? "translate-x-6" : "translate-x-0"
                                }`}
                            >
                                {theme === "dark" ? "🌙" : "☀️"}
                            </span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full border dark:border-stone-600 rounded-lg py-2 mt-4 font-medium text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700"
                >
                    Close
                </button>
            </div>
        </div>
    );
}