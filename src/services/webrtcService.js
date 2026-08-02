const ICE_SERVERS = [
    { urls: "stun:openrelay.metered.ca:80" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
];

const VIDEO_MAX_BITRATE = 1_500_000;

let localStream = null;
let peerConnections = {};
let sendSignal = null;
let onRemoteStream = null;
let onPeerLeft = null;

export const initWebRTC = ({ sendSignalFn, onRemoteStreamFn, onPeerLeftFn }) => {
    sendSignal = sendSignalFn;
    onRemoteStream = onRemoteStreamFn;
    onPeerLeft = onPeerLeftFn;
};

export const getLocalStream = async (callType) => {
    const constraints = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video:
            callType === "video"
                ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                    facingMode: "user"
                }
                : false
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return localStream;
};

export const getLocalStreamRef = () => localStream;

const boostVideoBitrate = (pc) => {
    pc.getSenders().forEach((sender) => {
        if (!sender.track || sender.track.kind !== "video") {
            return;
        }

        const params = sender.getParameters();

        if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
        }

        params.encodings[0].maxBitrate = VIDEO_MAX_BITRATE;

        sender.setParameters(params).catch(() => {});
    });
};

const createPeerConnection = (peerEmail) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (localStream) {
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });
    }

    pc.onicecandidate = (event) => {
        if (event.candidate && sendSignal) {
            sendSignal({
                type: "webrtc-ice-candidate",
                targetEmail: peerEmail,
                payload: event.candidate
            });
        }
    };

    pc.ontrack = (event) => {
        if (onRemoteStream) {
            onRemoteStream(peerEmail, event.streams[0]);
        }
    };

    pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "disconnected" || state === "failed" || state === "closed") {
            if (onPeerLeft) {
                onPeerLeft(peerEmail);
            }
        }
    };

    peerConnections[peerEmail] = pc;
    return pc;
};

const getOrCreatePeerConnection = (peerEmail) => {
    return peerConnections[peerEmail] || createPeerConnection(peerEmail);
};

export const createOfferTo = async (peerEmail) => {
    const pc = getOrCreatePeerConnection(peerEmail);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    boostVideoBitrate(pc);

    sendSignal({
        type: "webrtc-offer",
        targetEmail: peerEmail,
        payload: offer
    });
};

export const handleOffer = async (peerEmail, sdp) => {
    const pc = getOrCreatePeerConnection(peerEmail);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    boostVideoBitrate(pc);

    sendSignal({
        type: "webrtc-answer",
        targetEmail: peerEmail,
        payload: answer
    });
};

export const handleAnswer = async (peerEmail, sdp) => {
    const pc = peerConnections[peerEmail];
    if (!pc) {
        return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    boostVideoBitrate(pc);
};

export const handleIceCandidate = async (peerEmail, candidate) => {
    const pc = peerConnections[peerEmail];
    if (!pc) {
        return;
    }

    try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
        console.error("ICE candidate error:", error);
    }
};

export const closePeerConnection = (peerEmail) => {
    const pc = peerConnections[peerEmail];
    if (pc) {
        pc.close();
        delete peerConnections[peerEmail];
    }
};

export const toggleMic = (enabled) => {
    if (!localStream) {
        return;
    }
    localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
    });
};

export const toggleCamera = (enabled) => {
    if (!localStream) {
        return;
    }
    localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
    });
};

export const endCall = () => {
    Object.keys(peerConnections).forEach((email) => {
        peerConnections[email].close();
    });
    peerConnections = {};

    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
    }
};