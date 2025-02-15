# IELTS Speaking Simulator Documentation

## Table of Contents
- [Overview](https://github.com/PrinceOfAlfred/ielts-speaking-sim/new/main?filename=README.md#overview)
- [Technical Architecture](https://github.com/PrinceOfAlfred/ielts-speaking-sim/new/main?filename=README.md#technical-architecture)
- [Challenges & Solutions](https://github.com/PrinceOfAlfred/ielts-speaking-sim/new/main?filename=README.md#challenges--solutions)
- [User Experience](https://github.com/PrinceOfAlfred/ielts-speaking-sim/new/main?filename=README.md#user-experience)
- [Setup & Deployment](https://github.com/PrinceOfAlfred/ielts-speaking-sim/new/main?filename=README.md#setup--deployment)


### Overview
The IELTS Speaking Simulator is a web application that provides real-time speaking assessment and feedback using AI technologies. It simulates the IELTS speaking test environment, offering:

- Real-time speech analysis
- AI-powered feedback
- IELTS-aligned scoring
- Practice and Test modes

> Experience the web application [here](https://ielts-speaking-sim.vercel.app/)
---
### Technical Architecture
#### LLM Integration
- Model: GPT-4o
- Purpose: IELTS examiner simulation and feedback generation

```
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
```


#### Scoring System
The application implements IELTS scoring criteria using a combination of the OpenAI and Speechace APIs:
| **Component** | **Description** | **Implementation** |
| -------------  | -------------  | -------------------|
| Fluency & Coherence | Speech flow, logical connection	 | Speechace API timing analysis
| Vocabulary | Word choice and range	| GPT-4o analysis
| Grammar | Structure accuracy	| Combined API analysis
| Pronunciation | Phoneme-level accuracy	| Speechace API analysis
| Overall | IELTS band score	| Weighted combination


#### API Integration
1. **Speechace API v9**: Primary speech analysis and transcription.
2. **OpenAI API**: Feedback generation and relevance checking.

```
const API_CONFIG = {
  speechace: {
    version: 'v9',
    baseURL: 'https://api.speechace.co/api/scoring/speech/v9/json',
    timeout: 30000
  },
  openai: {
    model: 'gpt-4o',
    temperature: 0.7
  }
};
```
---

### Challenges & Solutions
#### 1. Performance Optimisation
- **Challenge**: Long processing times for speech analysis.
- **Solution**: Implemented compression and caching in the backend.

```
import compression from "compression";
import expressCache from "express-cache-controller";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

app.use(compression());
app.use(expressCache());
```

#### 2. API Reliability
- **Challenge**: Intermittent Speechace API availability.
- **Solution**: Implemented a retry mechanism.


#### 3. Test Result State Management
- **Challenge**: Unable to track state for multiple questions in the same part
- **Solution**: Implemented a simpler Test session flow (Part 1 - Part 3)

#### 4. Miscellaneous low-level tasks
- **Challenge**: Encountered several tedious tasks that slowed down progress.
- **Solution**: Delegated low-level thinking to an AI Assistant (DeepSeek & Claude)

---

### User Experience
#### Loading States
- Visual feedback during analysis
- Progress indicators

#### Error Handling
- User-friendly error messages
- Retry options
- Clear instructions

---

### Setup & Deployment
#### Prerequisites
- Node.js >= 14
- npm >= 6
- [OpenAI API Key](https://platform.openai.com/)
- [Speechace API key](https://www.speechace.com/)

#### Installation
```
# Clone repository
git clone https://github.com/PrinceOfAlfred/ielts-speaking-sim.git

# Install client dependencies
cd frontend
npm install

# Install server dependencies
cd backend
npm install
```

#### Environment Variables
```
# in the backend directory
OPENAI_API_KEY=your_openai_key
SPEECHACE_KEY=your_speechace_key
PORT=5000
NODE_ENV=development
```

#### Development
```
# Start frontend
cd frontend
npm run dev

# Start backend
cd backend
npm start
```

---

### Future Improvements
- Parallel API processing
- Offline capabilities
- User session management
- Enhanced caching strategies
