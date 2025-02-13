/* eslint-disable react/prop-types */
import { useState } from "react";
import "../styles/SessionManager.scss";

const SessionManager = ({ onModeChange }) => {
  const [activeMode, setActiveMode] = useState("practice");

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    onModeChange(mode);
  };

  return (
    <div className="session-manager">
      <div className="mode-toggle">
        <button
          className={activeMode === "practice" ? "active" : ""}
          onClick={() => handleModeChange("practice")}
        >
          Practice
        </button>
        <button
          className={activeMode === "test" ? "active" : ""}
          onClick={() => handleModeChange("test")}
        >
          Full Test
        </button>
      </div>
    </div>
  );
};

export default SessionManager;
