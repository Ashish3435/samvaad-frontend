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

            alert("Registration Successful");

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

        <div className="min-h-screen flex items-center justify-center bg-slate-100">

            <form
                onSubmit={handleRegister}
                className="bg-white p-10 rounded-xl shadow-lg w-96"
            >

                <h2 className="text-3xl font-bold mb-8 text-center">
                    Create Account
                </h2>

                <input
                    className="w-full border p-3 rounded mb-4"
                    placeholder="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                />

                <input
                    className="w-full border p-3 rounded mb-4"
                    placeholder="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    className="w-full border p-3 rounded mb-6"
                    placeholder="Password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded"
                >
                    Register
                </button>

                <p className="text-center mt-6">

                    Already have an account?{" "}

                    <Link
                        to="/login"
                        className="text-blue-600 font-semibold"
                    >
                        Login
                    </Link>

                </p>

            </form>

        </div>
    );
}