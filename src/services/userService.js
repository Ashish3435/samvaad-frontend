import api from "../api/axios";

export const getOnlineUsers = async () => {

    const response =
        await api.get("/users/online");

    return response.data;

};

export const getAllUsers = async () => {

    const response =
        await api.get("/users/status");

    return response.data;

};

export const searchUsers = async (keyword) => {

    const response =
        await api.get("/users/search", {

            params: {
                keyword
            }

        });

    return response.data;

};