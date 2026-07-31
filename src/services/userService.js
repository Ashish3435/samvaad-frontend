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

export const getMyProfile = async () => {

    const response =
        await api.get("/users/me");

    return response.data;

};

export const updateProfilePhoto = async (profileImageBase64) => {

    const response =
        await api.put("/users/me/photo", {

            profileImageBase64

        });

    return response.data;

};

export const updateAboutStatus = async (aboutStatus) => {

    const response =
        await api.put("/users/me/about", {

            aboutStatus

        });

    return response.data;

};