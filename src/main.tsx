import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { DataProvider } from "./common/DataContext.js";
import { SettingsProvider } from "./common/settings/SettingsContext.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <DataProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
);
