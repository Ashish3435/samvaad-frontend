import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

import {
    isAuthenticated
} from "./services/authService";


function ProtectedRoute({ children }) {
    if (!isAuthenticated()) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}


function PublicRoute({ children }) {
    if (isAuthenticated()) {
        return (
            <Navigate
                to="/chat"
                replace
            />
        );
    }

    return children;
}


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* ROOT */}
                <Route
                    path="/"
                    element={
                        <Navigate
                            to={
                                isAuthenticated()
                                    ? "/chat"
                                    : "/login"
                            }
                            replace
                        />
                    }
                />

                {/* LOGIN */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                {/* REGISTER */}
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />

                {/* CHAT */}
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />

                {/* CHAT WITH ROOM */}
                <Route
                    path="/chat/:chatId"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;