/* eslint-disable react/prop-types */
import { createContext, useContext, useState } from "react";

const TestModeContext = createContext();

export const TestModeProvider = ({ children }) => {
  // Structure to hold results for Part 1, Part 2, Part 3
  const [testResults, setTestResults] = useState({
    part1: null,
    part2: null,
    part3: null,
  });

  // Helper to update a specific part result
  const updateResult = (part, result) => {
    setTestResults((prev) => ({ ...prev, [part]: result }));
  };

  return (
    <TestModeContext.Provider value={{ testResults, updateResult }}>
      {children}
    </TestModeContext.Provider>
  );
};

export const useTestMode = () => useContext(TestModeContext);
