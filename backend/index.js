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
const speechaceURL = `https://api.speechace.co/api/scoring/speech/v9/json?key=${process.env.SPEECHACE_KEY}`;
const OPENAI_PROMPT = `# ROLE:
  You are an expert IELTS examiner who specializes in providing expert feedback on an examinee's speech. The speaker will be using you to practice their speaking skills and improve their IELTS score.
  
  # TASK:
  Your task is to provide detailed feedback on the speaker's pronunciation, fluency, grammar, vocabulary, and coherence.
  You will be given a transcript, a set of IELTS scores and an array of analysed pronunciation data for each word, syllable, and phoneme in the speech. You will use that data to provide feedback on the speaker's text or speech.
  The feedback should identify errors and provide guidance for improvement. For example:
    - When providing feedback on pronunciation - "Try pronouncing 'schedule' as 'sked-jool'".
    - When providing feedback on fluency - "Try to speak more smoothly and naturally. Take your time with your speech".
    - When providing feedback on grammar - "Use the past tense to describe past events".
    - When providing feedback on vocabulary - "Use a wider range of vocabulary to express your ideas (e.g. 'Instead of saying "important", use a synonym like "crucial"'".
    - When providing feedback on coherence - "Try to link your ideas more clearly and logically. You can do this by taking a few moments to think about what to say before you say it".
  The feedback should be clear and actionable, helping users improve their spoken English.
  
  # CONTEXT
  Here are the variables you'll use to grade the speaker's speech:
  The "word_score_list" node contains pronunciation scores and metrics for each word, syllable, and phoneme within the utterance - use that to provide phoneme-level analysis feedback on pronunciation.
  The "ielts_score" node contains An overall score on an IELTS scale of 0 to 9.0, in addition to subscores for: Fluency, Pronunciation, Grammar, Vocabulary, Coherence.
  The "transcript" node contains the speech-to-text transcript of what the user has said.

  Use the information to provide detailed feedback on the speaker's pronunciation, fluency, grammar, vocabulary, and coherence. 
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

      const config = {
        headers: {
          ...form.getHeaders(),
          Accept: "application/json",
          connection: "keep-alive",
        },
        timeout: 30000,
      };

      const speechaceResponse = await axios.post(speechaceURL, form, config);

      if (speechaceResponse.data.status !== "success") {
        console.error("Speechace response:", speechaceResponse.data);
        throw new Error(
          `Speechace analysis failed: ${JSON.stringify(speechaceResponse.data)}`
        );
      }

      const { transcript, ielts_score, relevance, word_score_list } =
        speechaceResponse.data.speech_score;

      // 2. Then send to OpenAI with the transcript
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "developer",
            content: OPENAI_PROMPT,
          },
          {
            role: "user",
            content: JSON.stringify({
              transcript,
              ielts_score,
              word_score_list,
            }),
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
