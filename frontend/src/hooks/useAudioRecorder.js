import { useState, useRef } from "react";
import axios from "axios";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const initializeRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
        audioBitsPerSecond: 16000,
      });

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };
    } catch (err) {
      setError("Microphone access denied");
      console.error(`Error accessing microphone:`, err);
    }
  };

  const startRecording = async () => {
    if (!mediaRecorder.current) {
      await initializeRecorder();
    }
    audioChunks.current = [];
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (
        !mediaRecorder.current ||
        mediaRecorder.current.state !== "recording"
      ) {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
    });
  };

  const analyzeSpeech = async (audioBlob, relevanceContext) => {
    setIsAnalyzing(true);
    const apiEndpoint =
      "https://ielts-speaking-simulator-backend.vercel.app/api/analyze-speech";

    try {
      const formData = new FormData();
      formData.append("user_audio_file", audioBlob, "audio.wav");
      formData.append("relevance_context", relevanceContext);

      const response = await axios.post(apiEndpoint, formData);
      return response.data;
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        console.error("Network error:", err);
        setError(
          "Connection failed. Please check your internet connection and try again."
        );
        throw err;
      }

      if (err.response?.status === 504) {
        console.error("Request timed out:", err);
        setError("Request timed out. Please try again.");
        throw err;
      }
      
      setError("Analysis failed. Please try again.");
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    startRecording,
    stopRecording,
    analyzeSpeech,
    isRecording,
    isAnalyzing,
    error,
    initializeRecorder,
  };
};

export default useAudioRecorder;
