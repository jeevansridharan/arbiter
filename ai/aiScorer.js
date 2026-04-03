// ai/aiScorer.js
// ─────────────────────────────────────────────────────────────────────────────
// Arbit — AI Milestone Scoring Service
//
// Uses Groq (llama3-70b) to evaluate a project description and return a
// weighted score out of 100, formatted as strict JSON.
//
// Scoring breakdown:
//   Innovation  → 30 pts
//   Feasibility → 30 pts
//   Impact      → 20 pts
//   Clarity     → 20 pts
//
// Usage:
//   node ai/aiScorer.js
//
// Environment variable required:
//   GROQ_API_KEY=your_key_here   (in arbiter/.env)
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama3-70b-8192";

// ─────────────────────────────────────────────────────────────────────────────
// Core scoring function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a project description using Groq AI.
 *
 * @param {string} description - Plain text description of the project / milestone.
 * @returns {Promise<{ score: number, reason: string }>}
 */
export async function evaluateProject(description) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY. Add it to your .env file:\n  GROQ_API_KEY=your_key_here"
    );
  }

  if (!description || description.trim().length === 0) {
    throw new Error("Project description cannot be empty.");
  }

  // ── Build the prompt ──────────────────────────────────────────────────────
  const systemPrompt = `
You are an expert project evaluator for a blockchain-based milestone funding platform called Arbit.
Your job is to score a project submission on a scale of 0–100 using these weighted criteria:

  1. Innovation  (30 pts) — Is the idea novel or creative?
  2. Feasibility (30 pts) — Can it realistically be built/executed?
  3. Impact      (20 pts) — Does it solve a real problem with meaningful reach?
  4. Clarity     (20 pts) — Is the description clear and well-structured?

Rules:
- Add up the four sub-scores to get a total out of 100.
- Be objective and concise.
- ALWAYS respond with ONLY valid JSON. No extra text, no markdown, no explanation outside the JSON.
- Response format (strict):
  {
    "score": <integer 0–100>,
    "reason": "<one sentence explaining the score>"
  }
`.trim();

  const userMessage = `Evaluate the following project milestone:\n\n"${description.trim()}"`;

  // ── Call Groq API ─────────────────────────────────────────────────────────
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      temperature: 0.2,          // low temp → consistent, deterministic scores
      max_tokens:  200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data    = await response.json();
  const raw     = data.choices?.[0]?.message?.content?.trim();

  if (!raw) {
    throw new Error("Empty response from Groq API.");
  }

  // ── Parse and validate JSON ───────────────────────────────────────────────
  let result;
  try {
    // Strip potential markdown code fences if the model wraps the JSON
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```$/i, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON:\n${raw}`);
  }

  const score = Number(result.score);
  if (isNaN(score) || score < 0 || score > 100) {
    throw new Error(`Score out of range: ${result.score}`);
  }

  return {
    score:  Math.round(score),
    reason: String(result.reason || "No reason provided."),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test / demo — runs when you execute: node ai/aiScorer.js
// ─────────────────────────────────────────────────────────────────────────────

async function runDemo() {
  const testDescription = `
    Arbit is a decentralized milestone funding platform on HashKey Chain.
    Creators lock ETH into a smart contract and submit proof of work for each milestone.
    An AI oracle evaluates the proof and gives a score from 0 to 100.
    If the score meets the project's threshold, funds are automatically released.
    Otherwise, the creator can request a refund. No voting required — fully automated.
  `.trim();

  console.log("─────────────────────────────────────────────");
  console.log("  Arbit AI Scorer — Demo");
  console.log("─────────────────────────────────────────────");
  console.log("Input description:\n");
  console.log(testDescription);
  console.log("\nEvaluating with Groq...\n");

  try {
    const result = await evaluateProject(testDescription);
    console.log("✅ Score Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

runDemo();
