import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setupAxiosAuth } from "./config/axiosSetup";

// Install the global access-token refresh interceptor before anything renders.
setupAxiosAuth();

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
