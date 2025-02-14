import express from "express";
import cors from "cors";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import compression from "compression";
import expressCache from "express-cache-controller";
import NodeCache from "node-cache";

dotenv.config();
const app = express();
const upload = multer();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const port = process.env.PORT || 5000;
const baseURL = "https://api.speechace.co/api/scoring/speech/v9/json";
const OPENAI_PROMPT = `
            Act as an IELTS examiner. Provide feedback on this response:
            - Correct grammatical errors.
            - Suggest vocabulary improvements.
            - Give pronunciation tips (e.g., "Try pronouncing 'schedule' as 'sked-jool'").
            Use the scores provided to guide your feedback.
            Format your response in the following JSON format: { "feedback": "..." }
          `;
const allowedOrigins = [
  "https://ielts-speaking-sim.vercel.app",
  "http://localhost:5173", // for local development
];

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(compression());
app.use(expressCache());

// Add detailed error logging
const handleSpeechaceError = (error) => {
  if (error.response) {
    console.error("Speechace API Error Response:", {
      status: error.response.status,
      data: error.response.data,
    });
    return `Speechace API Error: ${
      error.response.data.message || "Unknown error"
    }`;
  } else if (error.request) {
    console.error("No response from Speechace API:", error.request);
    return "No response from speech analysis service";
  } else {
    console.error("Error setting up request:", error.message);
    return error.message;
  }
};

app.post(
  "/api/analyze-speech",
  upload.single("user_audio_file"),
  async (req, res) => {
    try {
      if (!req.file) {
        throw new Error("No audio file provided");
      }

      // Check cache first
      const cacheKey = `speech_${req.file.size}_${req.body.relevance_context}`;
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }

      // 1. First get Speechace analysis
      const form = new FormData();
      form.append("user_audio_file", req.file.buffer, {
        filename: "audio.wav",
        contentType: req.file.mimetype,
      });
      form.append("dialect", "en-us");
      form.append("relevance_context", req.body.relevance_context);

      const speechaceResponse = await axios.post(
        `${baseURL}?key=${process.env.SPEECHACE_KEY}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );

      if (speechaceResponse.data.status !== "success") {
        throw new Error(
          `Speechace analysis failed: ${JSON.stringify(speechaceResponse.data)}`
        );
      }

      const { transcript, ielts_score, relevance } =
        speechaceResponse.data.speech_score;

      // 2. Then send to OpenAI with the transcript
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: OPENAI_PROMPT,
          },
          {
            role: "user",
            content: JSON.stringify({ transcript, ielts_score }),
          },
        ],
        response_format: { type: "json_object" },
      });

      const feedback = JSON.parse(openaiResponse.choices[0].message.content);

      const result = {
        transcript,
        scores: ielts_score,
        feedback: feedback.feedback,
        relevance: relevance.class,
      };

      cache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      const errorMessage = handleSpeechaceError(error);
      console.error("Error details:", errorMessage);
      res.status(500).json({
        error: errorMessage,
        details: error,
      });
    }
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
