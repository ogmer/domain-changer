import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Force Japanese-only UI as requested by user
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
