// File: src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Cần router
import App from "./App";
import { AuthProvider } from "./context/AuthContext"; // Import
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* BỌC Ở ĐÂY */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
