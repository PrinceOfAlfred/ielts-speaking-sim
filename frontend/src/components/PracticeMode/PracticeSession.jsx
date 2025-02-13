import { useState } from "react";
import SpeechRecorder from "../SpeechRecorder";
import PracticeResult from "./PracticeResult";
import { PRACTICE_QUESTIONS } from "../../data/practiceQuestions";
import "../../styles/PracticeMode.scss";

const PracticeSession = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [results, setResults] = useState(null);

  const handleAnalysisComplete = (data) => {
    setResults(data);
  };

  const handleNextQuestion = () => {
    setResults(null);
    setCurrentQuestion((prev) => (prev + 1) % PRACTICE_QUESTIONS.length);
  };

  return (
    <div className="practice-session">
      <div className="question-card">
        <h3>Practice Question</h3>
        <p className="question-topic">
          Topic: {PRACTICE_QUESTIONS[currentQuestion].topic}
        </p>
        <p className="question-text">
          Question: {PRACTICE_QUESTIONS[currentQuestion].text}
        </p>
      </div>

      <SpeechRecorder
        relevanceContext={PRACTICE_QUESTIONS[currentQuestion].text}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {results && (
        <div className="practice-results">
          <PracticeResult results={results} />
          <div className="practice-controls">
            <button className="next-question" onClick={handleNextQuestion}>
              Next Question
            </button>
            <button
              className="finish-practice"
              onClick={() => {
                setCurrentQuestion(0);
                setResults(null);
              }}
            >
              Finish Practice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeSession;
