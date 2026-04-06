import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { FontProvider } from "./context/FontContext";
import "./styles/global.css";
import { AdminProvider } from "./context/AdminContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/blog">
      <ThemeProvider>
        <FontProvider>
          <AdminProvider>
            <App />
          </AdminProvider>
        </FontProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
