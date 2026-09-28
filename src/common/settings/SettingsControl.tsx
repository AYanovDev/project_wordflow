import type { ChangeEvent } from "react";
import { useSettings } from "./SettingsContext";
import "./settingsControl.css";

export function SettingsControl() {
  const { autoskip, confetti, setSettings } = useSettings();

  function handleAutoskipChange(event: ChangeEvent<HTMLInputElement>) {
    setSettings({ autoskip: event.target.checked, confetti });
  }

  function handleConfettiChange(event: ChangeEvent<HTMLInputElement>) {
    setSettings({ autoskip, confetti: event.target.checked });
  }

  return (
    <div className="settings-container">
      <div className="toggle">
        <input
          type="checkbox"
          checked={autoskip}
          onChange={handleAutoskipChange}
        />
        <label>Auto round skip</label>
      </div>
      <div className="toggle">
        <input
          type="checkbox"
          checked={confetti}
          onChange={handleConfettiChange}
        />
        <label>Confetti animation</label>
      </div>
    </div>
  );
}
