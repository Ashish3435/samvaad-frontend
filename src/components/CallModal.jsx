import { useEffect, useRef } from "react";

function ParticipantTile({ name, stream, isVideoCall }) {
    const mediaRef = useRef(null);

    useEffect(() => {
        if (mediaRef.current && stream) {
            mediaRef.current.srcObject = stream;
        }
    }, [stream]);

    if (isVideoCall) {
        return (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video ref={mediaRef} autoPlay playsInline className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-0.5 rounded">
                    {name}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center bg-stone-800 rounded-lg p-6">
            <audio ref={mediaRef} autoPlay />
            <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl font-bold mb-2">
                {name?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-white text-sm">{name}</span>
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
    const localVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    if (!callState) {
        return null;
    }

    const isVideoCall = callState.callType === "video";
    const participantEntries = Object.entries(callState.participants || {});

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

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col z-50 p-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto content-start">
                {participantEntries.map(([email, participant]) => (
                    <ParticipantTile
                        key={email}
                        name={participant.name || email}
                        stream={participant.stream}
                        isVideoCall={isVideoCall}
                    />
                ))}

                {isVideoCall && (
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-0.5 rounded">
                            You
                        </span>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-4 py-4">
                <button
                    onClick={onToggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                        micOn ? "bg-stone-700" : "bg-red-600"
                    }`}
                >
                    {micOn ? "🎤" : "🔇"}
                </button>

                {isVideoCall && (
                    <button
                        onClick={onToggleCamera}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                            cameraOn ? "bg-stone-700" : "bg-red-600"
                        }`}
                    >
                        {cameraOn ? "📹" : "🚫"}
                    </button>
                )}

                <button
                    onClick={onEnd}
                    className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-xl"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}