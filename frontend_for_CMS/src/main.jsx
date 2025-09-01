import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App"
import "./index.css"; // Import Tailwind CSS
ReactDOM.createRoot(document.getElementById("root")).render(
    <Router> {/* Dùng React Router để điều hướng */}
      <App />
    </Router>
);
