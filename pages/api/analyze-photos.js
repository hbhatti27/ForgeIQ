import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { frontUrl, sideUrl, backUrl, weight, height, gender, userId } = req.body;
 
  if (!frontUrl || !sideUrl || !backUrl || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are analyzing three physique progress photos (front, side, and back) of a ${height}, ${weight}-pound ${gender}. Based on visible muscle definition, vascularity, symmetry, and fat distribution:
 
 1. Estimate the body fat percentage as accurately as possible.
 2. Estimate the lean body mass in pounds.
 3. Identify the user's weakest muscle groups that are visually underdeveloped or asymmetrical, based on proportion and typical standards for the given gender and body type.
 
 Return the results in this exact JSON format:
 {
   "bodyFat": (number, rounded to 1 decimal),
   "leanBodyMass": (number, rounded to 1 decimal),
   "weakPoints": ["group1", "group2", ...]
 }`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: frontUrl } },
            { type: 'image_url', image_url: { url: sideUrl } },
            { type: 'image_url', image_url: { url: backUrl } },
          ],
        },
      ],
      response_format: 'json',
      max_tokens: 300,
    });

    const { bodyFat, leanBodyMass, weakPoints } = JSON.parse(response.choices[0].message.content.trim());
    const userPlan = await prisma.trainingPlan.findUnique({
      where: { userId },
      select: { trainingDays: true },
    });

    await prisma.trainingPlan.update({
      where: { userId },
      data: {
        bodyFat,
        leanBodyMass,
        weakPoints,
      },
    });

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/training/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, trainingDays: userPlan?.trainingDays || 5, weakPoints }),
    });

    res.status(200).json({ bodyFat, leanBodyMass, weakPoints });
    
  } catch (err) {
    console.error('AI analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
}