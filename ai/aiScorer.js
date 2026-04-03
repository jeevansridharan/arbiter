// ai/aiScorer.js
// ─────────────────────────────────────────────────────────────────────────────
// Arbit — Mock AI Scoring Service
// No external API required. Run with: node ai/aiScorer.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a project description and returns an AI-style score.
 *
 * @param {string} description - Project or milestone description.
 * @returns {{ score: number, reason: string }}
 */
function evaluateProject(description) {
  // Generate a random score between 60 and 95 (inclusive)
  const score = Math.floor(Math.random() * (95 - 60 + 1)) + 60;

  const result = {
    score: score,
    reason: "AI-evaluated based on innovation and feasibility",
  };

  console.log("─────────────────────────────────────────");
  console.log("  Arbit AI Scorer");
  console.log("─────────────────────────────────────────");
  console.log("Project:", description);
  console.log("Score  :", result.score);
  console.log("Reason :", result.reason);
  console.log("─────────────────────────────────────────");

  return result;
}

// ── Test example ─────────────────────────────────────────────────────────────
const output = evaluateProject("AI based crowdfunding system");
console.log("\nJSON Output:");
console.log(JSON.stringify(output, null, 2));
