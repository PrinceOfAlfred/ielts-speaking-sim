import { useState } from "react";
import Part1Intro from "./Part1Intro";
import Part2LongTurn from "./Part2LongTurn";
import Part3Discussion from "./Part3Discussion";
import TestResults from "./TestResults";

const TestSession = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  return (
    <div>
      {currentStep === 1 && <Part1Intro onNext={handleNextStep} />}
      {currentStep === 2 && <Part2LongTurn onNext={handleNextStep} />}
      {currentStep === 3 && <Part3Discussion onNext={handleNextStep} />}
      {currentStep === 4 && <TestResults />}
    </div>
  );
};

export default TestSession;
