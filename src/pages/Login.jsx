import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";

export default function Login() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            await login(form);

            alert("Login Successful");

            navigate("/chat");

        } catch (err) {
            alert("Invalid Email or Password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">

            <form
                onSubmit={handleLogin}
                className="bg-white p-10 rounded-xl shadow-lg w-96"
            >

                <h2 className="text-3xl font-bold mb-8 text-center">
                    Welcome Back
                </h2>

                <input
                    className="w-full border p-3 rounded mb-4"
                    placeholder="Email"
                    name="email"
                    onChange={handleChange}
                />

                <input
                    className="w-full border p-3 rounded mb-6"
                    placeholder="Password"
                    type="password"
                    name="password"
                    onChange={handleChange}
                />

                <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded"
                >
                    Login
                </button>

                <p className="text-center mt-6">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-blue-600 font-semibold"
                    >
                        Register
                    </Link>
                </p>

            </form>

        </div>
    );
}