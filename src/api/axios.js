import axios from "axios";

const API_URL = import.meta.env.PROD
    ? "https://samvaad-0c2e.onrender.com"
    : "http://localhost:8083";

const api = axios.create({

    baseURL: `${API_URL}/api`,

    headers: {

        "Content-Type":
            "application/json"

    }

});

api.interceptors.request.use(

    (config) => {

        const token =
            localStorage.getItem("token");

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        }

        return config;

    }

);

export default api;