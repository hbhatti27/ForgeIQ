import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Note: This route only retrieves today's workout.

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId in query' });
  }

  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { userId },
    });

    if (!plan || !plan.dailySchedule) {
      return res.status(404).json({ message: 'Training plan not found or invalid' });
    }

    const schedule = plan.dailySchedule;
    const todayPlan = Array.isArray(schedule) ? schedule[0] : null; // Only retrieve today's workout

    res.status(200).json({
      message: 'Training plan for today retrieved',
      workout: todayPlan,
    });
  } catch (err) {
    console.error('Error retrieving today\'s workout:', err);
    res.status(500).json({ message: 'Failed to retrieve training plan' });
  }
}
