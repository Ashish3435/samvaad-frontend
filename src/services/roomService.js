import api from "../api/axios";

export const getRooms = async () => {

    const response =
        await api.get("/rooms/my");

    return response.data;

};

export const createRoom = async (
    roomName,
    roomType
) => {

    const response =
        await api.post("/rooms", {

            roomName,
            roomType,

        });

    return response.data;

};

export const createPrivateRoom = async (
    email
) => {

    const response =
        await api.post("/rooms/private", {

            email,

        });

    return response.data;

};

export const addMember = async (
    roomCode,
    email
) => {

    const response =
        await api.post(`/rooms/${roomCode}/members`, {

            email,

        });

    return response.data;

};

export const removeMember = async (
    roomCode,
    email
) => {

    const response =
        await api.delete(`/rooms/${roomCode}/members`, {

            data: { email },

        });

    return response.data;

};

export const promoteToAdmin = async (
    roomCode,
    email
) => {

    const response =
        await api.post(`/rooms/${roomCode}/promote`, {

            email,

        });

    return response.data;

};