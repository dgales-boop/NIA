import "../css/app.css";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App";

const rootElement = document.getElementById("app");

if (rootElement) {
    createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}
