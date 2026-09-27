import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "settings";
const SettingsContext = createContext(null);

function getSetings() {
  try {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);

    if (!savedPreferences) {
      return { autoskip: false, confetti: true };
    }

    const { autoskip, confetti } = JSON.parse(savedPreferences);

    return { autoskip, confetti };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { autoskip: false, confetti: true };
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(getSetings);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        autoskip: settings.autoskip,
        confetti: settings.confetti,
      }),
    );
  }, [settings]);

  const value = useMemo(
    () => ({
      autoskip: settings.autoskip,
      confetti: settings.confetti,
      setSettings,
    }),
    [settings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used inside a SettingsProvider");
  }

  return context;
}
