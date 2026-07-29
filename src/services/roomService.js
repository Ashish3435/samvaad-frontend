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