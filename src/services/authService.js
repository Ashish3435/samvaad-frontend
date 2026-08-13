import api from "../api/axios";

export const register = async (userData) => {
    const response = await api.post(
        "/auth/register",
        userData
    );

    return response.data;
};

export const login = async (userData) => {
    const response = await api.post(
        "/auth/login",
        userData
    );

    const token = response.data.token;

    localStorage.setItem(
        "token",
        token
    );

    return response.data;
};

export const getCurrentUser = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {
        const payload = JSON.parse(
            atob(
                token.split(".")[1]
            )
        );

        // Check JWT expiration
        if (
            payload.exp &&
            Date.now() >= payload.exp * 1000
        ) {
            localStorage.removeItem("token");
            return null;
        }

        return payload.sub
            ?.trim()
            .toLowerCase();

    } catch (error) {
        console.error(
            "JWT PARSE ERROR:",
            error
        );

        localStorage.removeItem("token");

        return null;
    }
};

export const isAuthenticated = () => {
    return Boolean(getCurrentUser());
};

export const logout = () => {
    localStorage.removeItem(
        "token"
    );
};