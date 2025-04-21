import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    userId,
    frontPhotoUrl,
    sidePhotoUrl,
    backPhotoUrl,
    bodyFat,
    leanBodyMass,
    date,
  } = req.body;

  if (!userId || !frontPhotoUrl || !sidePhotoUrl || !backPhotoUrl) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const prompt = `
You are analyzing bodybuilding physique check-in photos. Based on the following front, side, and back images, identify underdeveloped muscle groups compared to a professional bodybuilder. Return only a concise, comma-separated list of weak muscle groups (e.g., calves, chest, rear delts).`;

    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: "Here are the physique images to evaluate." },
            { type: 'image_url', image_url: { url: frontPhotoUrl } },
            { type: 'image_url', image_url: { url: sidePhotoUrl } },
            { type: 'image_url', image_url: { url: backPhotoUrl } },
          ]
        }
      ],
      max_tokens: 100,
    });

    const weakPointText = visionResponse.choices[0].message.content;
    const detectedWeakPoints = weakPointText
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);

    const saved = await prisma.workoutLog.create({
      data: {
        userId,
        day: 0,
        completed: false,
        exercises: {
          frontPhotoUrl,
          sidePhotoUrl,
          backPhotoUrl,
          bodyFat,
          leanBodyMass,
          date: date || new Date().toISOString(),
        },
        content: { note: "initial check-in" },
        weakPoints: detectedWeakPoints,
        weakPointAnalyzedAt: new Date()
      },
    });

    res.status(200).json({ message: 'Check-in saved', saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save check-in', error: err.message });
  }
}