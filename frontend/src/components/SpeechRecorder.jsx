/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect } from "react";
import useAudioRecorder from "../hooks/useAudioRecorder";
import "../styles/SpeechRecorder.scss";

const SpeechRecorder = ({ relevanceContext, onAnalysisComplete }) => {
  const {
    initializeRecorder,
    startRecording,
    stopRecording,
    analyzeSpeech,
    isRecording,
    isAnalyzing,
    error,
  } = useAudioRecorder();

  useEffect(() => {
    initializeRecorder();
  }, []); // don't add `initializeRecorder` to dependency array. It'll stop the recording button from sending off the payload in practice mode

  const handleRecording = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        const results = await analyzeSpeech(audioBlob, relevanceContext);
        onAnalysisComplete(results);
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className="speech-recorder">
      <button
        onClick={handleRecording}
        disabled={isAnalyzing}
        className={`record-button ${isRecording ? "recording" : ""}`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
        {isAnalyzing && " (Analyzing...)"}
      </button>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default SpeechRecorder;
