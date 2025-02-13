/* eslint-disable react/prop-types */
import "../../styles/Results.scss";

const PracticeResult = ({ results }) => {
  if (!results) return null;

  if (results.relevance !== "TRUE") {
    return (
      <div className="results-container">
        <div className="error-message">
          Your answer is not relevant to the question. Please answer
          appropriately!
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="part-results">
        <h3>Transcript</h3>
        <div className="transcript">
          <p>{results.transcript}</p>
        </div>

        <h3>IELTS Scores</h3>
        <div className="scores">
          <div className="score-item">
            <span className="score-label">Fluency:</span>
            <span className="score-value">{results.scores.fluency}/9</span>
          </div>
          <div className="score-item">
            <span className="score-label">Pronunciation:</span>
            <span className="score-value">
              {results.scores.pronunciation}/9
            </span>
          </div>
          <div className="score-item">
            <span className="score-label">Grammar:</span>
            <span className="score-value">{results.scores.grammar}/9</span>
          </div>
          <div className="score-item">
            <span className="score-label">Vocabulary:</span>
            <span className="score-value">{results.scores.vocab}/9</span>
          </div>
          <div className="score-item">
            <span className="score-label">Coherence:</span>
            <span className="score-value">{results.scores.coherence}/9</span>
          </div>
          <div className="score-item">
            <span className="score-label">Overall:</span>
            <span className="score-value">{results.scores.overall}/9</span>
          </div>
        </div>

        <h3>Examiner Feedback</h3>
        <div className="feedback">
          {results.feedback.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeResult;
