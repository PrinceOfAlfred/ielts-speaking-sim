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

  const compressAudio = async (blob) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const offlineContext = new OfflineAudioContext({
      numberOfChannels: 1,
      length: Math.ceil(audioBuffer.duration * 16000),
      sampleRate: 16000,
    });

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();

    const wavBuffer = new ArrayBuffer(44 + renderedBuffer.length * 2);
    const view = new DataView(wavBuffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + renderedBuffer.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 16000 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, renderedBuffer.length * 2, true);

    const samples = renderedBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }

    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const analyzeSpeech = async (audioBlob, relevanceContext) => {
    setIsAnalyzing(true);
    const apiEndpoint =
      "https://ielts-speaking-simulator-backend.vercel.app/api/analyze-speech";

    try {
      const compressedBlob = await compressAudio(audioBlob);
      const formData = new FormData();
      formData.append("user_audio_file", compressedBlob, "audio.wav");
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
