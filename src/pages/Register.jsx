import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";

export default function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e) => {

        e.preventDefault();

        try {

            await register(form);

            navigate("/login");

        } catch (err) {

            console.error(
                "REGISTRATION ERROR:",
                err
            );

            alert(
                err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                "Registration Failed"
            );
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-stone-950 px-4">
            <form
                onSubmit={handleRegister}
                className="bg-white dark:bg-stone-800 p-10 rounded-xl shadow-lg w-96"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-md shadow-teal-200 dark:shadow-none mb-3">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-400 dark:to-cyan-300 bg-clip-text text-transparent tracking-tight">
                        Samvaad
                    </h1>

                    <p className="text-sm text-gray-400 dark:text-stone-400 mt-1">
                        Where conversations feel like home
                    </p>
                </div>

                <input
                    className="w-full border dark:border-stone-600 p-3 rounded mb-4 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-400"
                    placeholder="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                />

                <input
                    className="w-full border dark:border-stone-600 p-3 rounded mb-4 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-400"
                    placeholder="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    className="w-full border dark:border-stone-600 p-3 rounded mb-6 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-400"
                    placeholder="Password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-[#993556] hover:bg-[#7a2b46] text-white py-3 rounded font-semibold"
                >
                    Register
                </button>

                <p className="text-center mt-6 text-gray-700 dark:text-stone-300">
                    Already have an account?{" "}

                    <Link
                        to="/login"
                        className="text-[#993556] dark:text-pink-400 font-semibold"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}