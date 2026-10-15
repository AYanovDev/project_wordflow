import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { DataProvider } from "./common/contexts/DataContext.js";
import { ProgressProvider } from "./common/contexts/ProgressContext.js";
import { SettingsProvider } from "./common/settings/SettingsContext.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <DataProvider>
        <ProgressProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </ProgressProvider>
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
);
