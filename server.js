import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/evaluate', async (req, res) => {
    const { workDescription } = req.body;
    if (!workDescription) {
        return res.status(400).json({ error: 'Work description is required' });
    }

    console.log('[API] Received evaluation request for:', workDescription.substring(0, 50) + '...');

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI evaluator for a Web3 funding platform called Arbit. Evaluate the work and return ONLY a numeric score from 0 to 100.',
                },
                {
                    role: 'user',
                    content: `Evaluate the following work and give a score from 0 to 100: ${workDescription}`,
                },
            ],
            model: 'llama-3.3-70b-versatile',
        });

        const content = completion.choices[0]?.message?.content || '0';
        const scoreMatch = content.match(/\d+/);
        const score = scoreMatch ? parseInt(scoreMatch[0], 10) : 0;

        console.log('[API] AI Score returned:', score);
        res.json({ score });
    } catch (error) {
        console.error('[API] Groq Error:', error.message);
        res.status(500).json({ error: 'Failed to evaluate with AI. Check your GROQ_API_KEY.' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`
🚀 Arbit AI Backend Running
━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: http://localhost:${PORT}
Endpoint: POST /api/evaluate
    `);
});
