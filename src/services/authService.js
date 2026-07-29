import api from "../api/axios";


export const register = async (userData) => {

    const response =
        await api.post(
            "/auth/register",
            userData
        );

    return response.data;

};


export const login = async (userData) => {

    const response =
        await api.post(
            "/auth/login",
            userData
        );

    const token =
        response.data.token;

    localStorage.setItem(
        "token",
        token
    );

    return response.data;

};


export const getCurrentUser = () => {

    const token =
        localStorage.getItem("token");

    if (!token) {

        return null;

    }


    try {

        const payload =
            JSON.parse(
                atob(
                    token.split(".")[1]
                )
            );


        return payload.sub
            ?.trim()
            .toLowerCase();


    } catch (error) {

        console.error(
            "JWT PARSE ERROR:",
            error
        );

        return null;

    }

};


export const logout = () => {

    localStorage.removeItem(
        "token"
    );

};