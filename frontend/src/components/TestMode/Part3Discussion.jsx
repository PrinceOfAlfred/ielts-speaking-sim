/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import useAudioRecorder from "../../hooks/useAudioRecorder";
import { useTestMode } from "../../context/TestModeContext";
import { part3Questions } from "../../data/part3Questions";
import "../../styles/TestMode.scss";

const Part3Discussion = ({ onNext }) => {
  const [phase, setPhase] = useState("prep");
  const [prepCountdown, setPrepCountdown] = useState(10);
  const [notes, setNotes] = useState("");
  const { updateResult } = useTestMode();
  const {
    initializeRecorder,
    startRecording,
    stopRecording,
    analyzeSpeech,
    isRecording,
    error,
  } = useAudioRecorder();

  useEffect(() => {
    if (phase === "prep") {
      const timer = setInterval(() => {
        setPrepCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPhase("record");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const handleStartRecording = async () => {
    if (phase === "record") {
      await initializeRecorder();
      await startRecording();
    }
  };

  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (blob && phase === "record") {
      setPhase("analyzing");
      handleSubmitAnswer(blob);
    }
  };

  const handleSubmitAnswer = async (audioBlob) => {
    const relevanceContext = JSON.stringify(part3Questions);
    try {
      const result = await analyzeSpeech(audioBlob, relevanceContext);
      updateResult("part3", {
        result,
        candidateNotes: notes,
        questions: part3Questions,
      });
      setPhase("complete");
      if (typeof onNext === "function") onNext();
    } catch (err) {
      console.error("Analysis error:", err);
      alert(`Analysis error: ${err.message}`);
      setPhase("record");
    }
  };

  return (
    <div className="test-mode">
      {phase === "prep" && (
        <div className="prep-phase">
          <h3>Part 3: Two-way Discussion</h3>

          <div className="prompts">
            <p>Questions:</p>
            <ul>
              {part3Questions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
          </div>

          <div className="timer">
            Prep time remaining: {prepCountdown} seconds
          </div>

          <textarea
            className="textarea-common"
            placeholder="Write your notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {phase === "record" && (
        <div className="record-phase">
          <h3>Now, record your answer</h3>
          <div className="prompts">
            {part3Questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </div>

          <p className="notes-display">Your notes: {notes}</p>

          {!isRecording && (
            <button className="record-button" onClick={handleStartRecording}>
              Start Recording
            </button>
          )}
          {isRecording && (
            <>
              <p className="recording-indicator">🔴 Recording in progress...</p>
              <button
                className="record-button recording"
                onClick={handleStopRecording}
              >
                Stop Recording
              </button>
            </>
          )}
        </div>
      )}

      {phase === "analyzing" && (
        <div className="analyzing-phase">
          <h3>Analyzing your answer...</h3>
          <div className="loading-spinner"></div>
        </div>
      )}

      {phase === "complete" && (
        <div className="complete-phase">
          <h3>Part 3 Complete</h3>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Part3Discussion;
