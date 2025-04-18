import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, plan } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const saved = await prisma.mealPlan.create({
      data: {
        userId,
        calories: plan.totalCalories,
        protein: plan.protein,
        carbs: plan.carbs,
        fats: plan.fats,
        dietType: plan.dietType,
        allergies: plan.allergies,
        data: JSON.stringify(plan),
        createdAt: new Date()
      }
    });

    return res.status(200).json({ message: 'Meal plan saved', id: saved.id });
  } catch (error) {
    console.error('[SAVE_MEALPLAN]', error);
    return res.status(500).json({ message: 'Failed to save meal plan' });
  }
}