const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increased limit to handle pasted or uploaded resume text

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("ElevateCV AI Backend Running 🚀");
});

// 1. Resume Analyzer Endpoint
app.post("/analyze-resume", async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ success: false, message: "Resume text missing." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert ATS resume reviewer and career coach. Analyze the resume text provided and return a JSON object strictly in this format:
          {
            "score": 85,
            "strengths": ["Clear work history", "Good usage of technical tools"],
            "improvements": ["Add quantifiable metrics to bullet points", "Include missing cloud certifications"],
            "summary": "Solid foundation with good technical layout, but needs metric-driven achievements."
          }`
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedData = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("Resume analysis error:", error.message);
    res.status(500).json({ success: false, message: "Server error analyzing resume." });
  }
});

// 2. Interview Coach Feedback Endpoint
app.post("/interview-feedback", async (req, res) => {
  try {
    const { answer, question, role, seniority, interviewMode, focusTopic } = req.body;

    if (!answer || !question) {
      return res.status(400).json({ success: false, message: "Question and Answer are required." });
    }

    const promptContext = `Target Role: ${role || 'General'}, Seniority: ${seniority || 'Mid-Level'}, Mode: ${interviewMode || 'Behavioral'}, Focus Topic: ${focusTopic || 'None'}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an elite technical and behavioral interview coach. Analyze the candidate response given this context: "${promptContext}".
          Return a JSON response strictly formatted as:
          {
            "score": 8.5,
            "communicationScore": 9,
            "technicalScore": 8,
            "strengths": ["Clear structured response", "Good context provided"],
            "improvements": ["Elaborate more on specific performance metrics or STAR framework"],
            "sampleAnswer": "An ideal answer would emphasize..."
          }`
        },
        {
          role: "user",
          content: `Question: ${question}\nCandidate Answer: ${answer}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedFeedback = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: parsedFeedback
    });

  } catch (error) {
    console.error("Interview feedback error:", error.message);
    res.status(500).json({ success: false, message: "Server error generating feedback." });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});