

import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const latest = await prisma.nutritionLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    if (!latest) {
      return res.status(404).json({ message: 'No nutrition log found' });
    }

    // For now return basic structure
    const samplePlan = {
      totalCalories: latest.calories,
      protein: latest.protein,
      carbs: latest.carbs,
      fats: latest.fats,
      dietType: user.dietType || 'balanced',
      allergies: user.allergies || [],
      meals: [
        {
          name: 'Breakfast',
          items: []
        },
        {
          name: 'Lunch',
          items: []
        },
        {
          name: 'Dinner',
          items: []
        },
        {
          name: 'Snacks',
          items: []
        }
      ]
    };

    const prompt = `
Create a 1-day meal plan divided into Breakfast, Lunch, Dinner, and Snacks that closely matches the following targets:
Calories: ${latest.calories}, Protein: ${latest.protein}g, Carbs: ${latest.carbs}g, Fats: ${latest.fats}g.
The user prefers a ${samplePlan.dietType} diet and avoids the following: ${samplePlan.allergies.join(', ') || 'none'}.

For each meal, list 2-3 food items with approximate macros (protein/carbs/fats) and estimated calories.
Return data in JSON format like:
{
  meals: [
    {
      name: "Breakfast",
      items: [
        { name: "Oatmeal with berries", protein: 15, carbs: 40, fats: 5, calories: 280 },
        ...
      ]
    },
    ...
  ]
}
`;

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const parsed = JSON.parse(gptResponse.choices[0].message.content);
    samplePlan.meals = parsed.meals;

    res.status(200).json({ message: 'Meal plan generated', plan: samplePlan });
  } catch (error) {
    console.error('[MEALPLAN_GENERATE]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}