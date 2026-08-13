import { createPortal } from "react-dom";

export default function IconRail({
                                     activeCategory,
                                     onCategoryChange,
                                     hasUnread,
                                     profile,
                                     onOpenProfileMenu,
                                     menuOpen,
                                     profileMenuNode
                                 }) {
    const getInitials = (name) => {
        if (!name) return "?";

        return name
            .trim()
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    const items = [
        { key: "CHAT", icon: "💬", label: "Chats" },
        { key: "GROUP", icon: "👥", label: "Groups" },
        { key: "CHANNEL", icon: "📢", label: "Channels" }
    ];

    return (
        <div className="w-16 shrink-0 bg-white dark:bg-stone-900 border-r dark:border-stone-700 flex flex-col items-center py-4 gap-3">

            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={() => onCategoryChange(item.key)}
                    className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                        activeCategory === item.key
                            ? "bg-[#993556] text-white"
                            : "text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800"
                    }`}
                    aria-label={item.label}
                >
                    <span className="text-lg leading-none">
                        {item.icon}
                    </span>

                    <span className="text-[9px] leading-none">
                        {item.label}
                    </span>

                    {hasUnread?.[item.key] &&
                        activeCategory !== item.key && (
                            <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-teal-500" />
                        )}
                </button>
            ))}

            <div className="flex-1" />

            <button
                type="button"
                onClick={onOpenProfileMenu}
                className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-teal-500 transition-all"
                aria-label="Profile menu"
            >
                {profile?.profileImageBase64 ? (
                    <img
                        src={profile.profileImageBase64}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                        {getInitials(profile?.fullName)}
                    </div>
                )}
            </button>

            {menuOpen &&
                createPortal(
                    <div
                        className="fixed z-[9999]"
                        style={{
                            left: "72px",
                            bottom: "16px",
                            maxWidth: "calc(100vw - 88px)"
                        }}
                    >
                        {profileMenuNode}
                    </div>,
                    document.body
                )}
        </div>
    );
}