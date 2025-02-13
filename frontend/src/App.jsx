import { useState } from "react";
import SessionManager from "./components/SessionManager";
import TestSession from "./components/TestMode/TestSession";
import PracticeSession from "./components/PracticeMode/PracticeSession";
import { TestModeProvider } from "./context/TestModeContext";
import "./styles/global.scss";
import Header from "./components/Header";

const App = () => {
  const [currentMode, setCurrentMode] = useState("practice");

  return (
    <div className="app-container">
      <Header />
      <SessionManager onModeChange={setCurrentMode} />

      {currentMode === "practice" ? (
        <PracticeSession />
      ) : (
        <TestModeProvider>
          <TestSession />
        </TestModeProvider>
      )}
    </div>
  );
};

export default App;
