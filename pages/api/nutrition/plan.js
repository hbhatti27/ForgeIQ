import prisma from '@/lib/prisma';

function calculateTDEE({ age, gender, height, weight, trainingDays }) {
  const heightCm = height * 2.54;
  const weightKg = weight * 0.453592;
  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activityFactor = trainingDays >= 5 ? 1.55 : trainingDays >= 3 ? 1.4 : 1.2;
  return Math.round(bmr * activityFactor);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { age, gender, height, weight, trainingDays, goal } = user;

    let baseCalories = calculateTDEE({ age, gender, height, weight, trainingDays });

    // Adjust for goal
    if (goal === 'fat loss') baseCalories -= 300;
    if (goal === 'muscle gain') baseCalories += 250;

    let protein = Math.round(weight * 1.0); // grams per lb
    let fats = Math.round(weight * 0.4);
    let carbs = Math.round((baseCalories - (protein * 4 + fats * 9)) / 4);
    let calories = baseCalories;
    let notes = 'Baseline plan generated from intake data and goal.';

    // Pull last 7 logs
    const logs = await prisma.trainingLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    });

    if (logs.length >= 4) {
      const volumes = logs.map(log => {
        return log.exercises.reduce((total, ex) =>
          total + ex.sets.reduce((s, set) => s + (set.weight * set.reps), 0), 0);
      }).reverse();

      const trend = volumes.slice(-2).reduce((a, b) => a + b, 0) / 2 -
                    volumes.slice(0, 2).reduce((a, b) => a + b, 0) / 2;

      if (trend < -200) {
        calories += 150;
        carbs += 30;
        notes = 'Training volume decline detected — slight increase in calories and carbs applied.';
      } else if (trend > 200) {
        notes = 'Training volume increasing — maintaining current intake.';
      }
    }

    return res.status(200).json({ calories, protein, carbs, fats, notes });
  } catch (err) {
    console.error('Nutrition AI error:', err);
    return res.status(500).json({ error: 'Failed to generate nutrition plan' });
  }
}