import { useEffect, useRef, useState } from "react";

function VideoTile({ stream, muted, mirrored, className }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={`${className} ${mirrored ? "scale-x-[-1]" : ""}`}
        />
    );
}

function AvatarTile({ name }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-stone-800">
            <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl font-bold">
                {name?.[0]?.toUpperCase() || "?"}
            </div>
        </div>
    );
}

export default function CallModal({
                                      callState,
                                      localStream,
                                      micOn,
                                      cameraOn,
                                      onAccept,
                                      onReject,
                                      onEnd,
                                      onToggleMic,
                                      onToggleCamera
                                  }) {
    const [mainId, setMainId] = useState("local");

    useEffect(() => {
        if (callState?.status === "in-call") {
            const firstRemote = Object.keys(callState.participants || {})[0];
            if (firstRemote) {
                setMainId(firstRemote);
            }
        }
    }, [callState?.status]);

    useEffect(() => {
        if (callState?.status === "in-call") {
            document.documentElement.requestFullscreen?.().catch(() => {});
        } else if (!callState && document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
        }
    }, [callState]);

    if (!callState) {
        return null;
    }

    const isVideoCall = callState.callType === "video";

    if (callState.status === "ringing-incoming") {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-stone-900 rounded-2xl p-8 text-center w-80">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-400 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                        {callState.callerName?.[0]?.toUpperCase() || "?"}
                    </div>

                    <p className="text-white text-lg font-semibold mb-1">
                        {callState.callerName}
                    </p>

                    <p className="text-stone-400 text-sm mb-6">
                        Incoming {isVideoCall ? "video" : "voice"} call
                    </p>

                    <div className="flex justify-center gap-6">
                        <button
                            onClick={onReject}
                            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-xl"
                        >
                            ✕
                        </button>

                        <button
                            onClick={onAccept}
                            className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white text-xl"
                        >
                            ✓
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (callState.status === "ringing-outgoing") {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-stone-900 rounded-2xl p-8 text-center w-80">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-400 mx-auto mb-4 flex items-center justify-center text-white text-2xl animate-pulse">
                        📞
                    </div>

                    <p className="text-white text-lg font-semibold mb-1">
                        Calling...
                    </p>

                    <p className="text-stone-400 text-sm mb-6">
                        {isVideoCall ? "Video" : "Voice"} call
                    </p>

                    <button
                        onClick={onEnd}
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-xl mx-auto"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    const remoteEntries = Object.entries(callState.participants || {});

    if (!isVideoCall) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <div className="flex-1 flex flex-wrap items-center justify-center gap-6 p-6">
                    {remoteEntries.map(([email, participant]) => (
                        <div key={email} className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 rounded-full bg-teal-600 text-white flex items-center justify-center text-3xl font-bold">
                                {participant.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-white text-sm">{participant.name}</span>
                            <VideoTile
                                stream={participant.stream}
                                muted={false}
                                className="hidden"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4 py-6">
                    <button
                        onClick={onToggleMic}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl ${
                            micOn ? "bg-stone-700" : "bg-red-600"
                        }`}
                    >
                        {micOn ? "🎤" : "🔇"}
                    </button>

                    <button
                        onClick={onEnd}
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-2xl"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    const allTiles = [
        {
            id: "local",
            name: "You",
            stream: localStream,
            isLocal: true
        },
        ...remoteEntries.map(([email, participant]) => ({
            id: email,
            name: participant.name || email,
            stream: participant.stream,
            isLocal: false
        }))
    ];

    const main = allTiles.find((tile) => tile.id === mainId) || allTiles[0];
    const thumbnails = allTiles.filter((tile) => tile.id !== main.id);

    return (
        <div className="fixed inset-0 bg-black z-50">
            <div className="absolute inset-0">
                {main.stream ? (
                    <VideoTile
                        stream={main.stream}
                        muted={main.isLocal}
                        mirrored={main.isLocal}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <AvatarTile name={main.name} />
                )}

                <span className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    {main.name}
                </span>
            </div>

            {thumbnails.length > 0 && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    {thumbnails.map((tile) => (
                        <button
                            key={tile.id}
                            onClick={() => setMainId(tile.id)}
                            className="w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg relative"
                        >
                            {tile.stream ? (
                                <VideoTile
                                    stream={tile.stream}
                                    muted={tile.isLocal}
                                    mirrored={tile.isLocal}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <AvatarTile name={tile.name} />
                            )}

                            <span className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-2 py-0.5 rounded">
                                {tile.name}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="absolute bottom-0 inset-x-0 flex justify-center gap-4 py-6 bg-gradient-to-t from-black/70 to-transparent">
                <button
                    onClick={onToggleMic}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl ${
                        micOn ? "bg-stone-700/80" : "bg-red-600"
                    }`}
                >
                    {micOn ? "🎤" : "🔇"}
                </button>

                <button
                    onClick={onToggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl ${
                        cameraOn ? "bg-stone-700/80" : "bg-red-600"
                    }`}
                >
                    {cameraOn ? "📹" : "🚫"}
                </button>

                <button
                    onClick={onEnd}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-2xl"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}