import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { registerSW } from "virtual:pwa-register";

registerSW({
    immediate: true,
});

const root = createRoot(document.getElementById("root"));

root.render(
    <StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </StrictMode>
);

requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        const loader = document.getElementById("app-loader");

        if (loader) {
            loader.remove();
        }
    });
});