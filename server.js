// server.js

// 1️⃣ Load environment variables
import 'dotenv/config'; 

import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import cors from "cors";
import { GoogleGenAI } from "@google/genai"; 

const app = express();
const port = process.env.PORT || 3000;

// 2️⃣ Middleware
app.use(cors()); // Allow requests from frontend
app.use(bodyParser.json());

// 3️⃣ Initialize Gemini Client
const client = new GoogleGenAI({});
const MODEL_NAME = "gemini-2.5-flash"; // Make sure your project has access to this model

// 4️⃣ Load notes.txt
let notesContent = "";
try {
  notesContent = fs.readFileSync("notes.txt", "utf-8");
  console.log("✅ notes.txt loaded successfully");
} catch (err) {
  console.error("❌ FATAL: Failed to load notes.txt:", err.message);
  process.exit(1); 
}

// 5️⃣ Optional: Load PDF if exists
const pdfPath = "./test/data/05-versions-space.pdf";
let pdfBuffer = null;

if (fs.existsSync(pdfPath)) {
  try {
    pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${pdfPath}`);
  } catch (err) {
    console.warn(`❌ Failed to read PDF: ${err.message}`);
  }
} else {
  console.warn(`⚠️ PDF file not found: ${pdfPath}`);
}

// 6️⃣ /ask endpoint
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Question is required." });

  try {
    const fullPrompt = `

    you can do basic conversation to the user your name is trix.
      You are a helpful assistant. Answer the user's question using ONLY the following notes.
      If the answer is not in the notes, say the information is not available.

      Notes:
      ---
      ${notesContent}
      ---

      Question: ${question}
    `;

    // Call Gemini API
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { role: "user", parts: [{ text: fullPrompt }] }
      ],
    });

    // Send response
    res.json({
      question,
      answer: response.text?.trim() || "No answer returned from Gemini."
    });

  } catch (err) {
    console.error("Gemini API Error:", err.message);
    res.status(500).json({ 
      error: "Failed to process request with Gemini API.",
      details: err.message 
    });
  }
});

// 7️⃣ /test endpoint (health check)
app.get("/test", (req, res) => {
  res.status(200).json({
    message: "Server is running and Gemini client initialized.",
    status: "OK",
    model: MODEL_NAME,
    notesLoaded: notesContent.length > 0,
    pdfLoaded: pdfBuffer !== null,
    timestamp: new Date().toISOString()
  });
});

// 8️⃣ Start server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
