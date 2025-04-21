import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are ForgeIQ, a world-class bodybuilding and nutrition AI coach. You specialize in evidence-based training and nutrition for clients ranging from complete novices to elite Olympia-level competitors. Always ground your advice in published, real-world scientific research and clinical literature. Only respond to questions related to training, muscle growth, fat loss, nutrition, supplements, recovery, and performance enhancement. If a user asks about unrelated topics (e.g., relationships, finance, technology), politely redirect them and clarify that your expertise is limited to bodybuilding, fitness, and health optimization.`
      },
      ...messages
    ],
  });

  res.status(200).json({ reply: completion.choices[0].message.content });
}