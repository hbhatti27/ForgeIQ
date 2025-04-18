import { PrismaClient } from '@prisma/client';

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
    // Fetch last 7 days of training logs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await prisma.trainingLog.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo }
      }
    });

    // Sort logs chronologically
    logs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate volume per log
    const volumes = logs.map(log => {
      let volume = 0;
      const exercises = log.exercises || [];
      for (const ex of exercises) {
        if (ex.sets) {
          for (const set of ex.sets) {
            const weight = Number(set.weight || 0);
            const reps = Number(set.reps || 0);
            volume += weight * reps;
          }
        }
      }
      return volume;
    });

    // Trend analysis
    const earlyAvg = volumes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const recentAvg = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;

    let baseCalories = 2000;
    let calories = baseCalories;
    let adjustmentNote = '';

    if (recentAvg < earlyAvg * 0.9) {
      calories += 100;
      adjustmentNote = 'Volume drop detected, increased calories';
    } else if (recentAvg > earlyAvg * 1.1) {
      adjustmentNote = 'Increased training output, maintaining macros';
    }

    // Recalculate macros
    const protein = Math.floor(calories * 0.3 / 4);
    let carbs = Math.floor(calories * 0.4 / 4);
    const fats = Math.floor(calories * 0.3 / 9);

    // If volume dropped, bump carbs slightly
    if (adjustmentNote.includes('increased calories')) {
      carbs = Math.floor(carbs * 1.1);
    }

    // Store new NutritionLog
    const entry = await prisma.nutritionLog.create({
      data: {
        userId,
        calories,
        protein,
        carbs,
        fats,
        adjustmentNote,
      }
    });

    return res.status(200).json({ message: 'Nutrition log updated', data: entry });
  } catch (error) {
    console.error('[UPDATE_NUTRITION]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}