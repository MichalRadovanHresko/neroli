import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/AuthProvider.jsx";
import "./index.css";
import App from "./App.jsx";

// Mount the app with routing, authentication, and shared styles enabled.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Keep URL navigation and authentication state available throughout the app. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
