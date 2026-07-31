const ICE_SERVERS = [
    { urls: "stun:openrelay.metered.ca:80" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
];

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
        audio: true,
        video: callType === "video"
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return localStream;
};

export const getLocalStreamRef = () => localStream;

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