import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, trainingDays, weakPoints } = req.body;

  if (!userId || !trainingDays || !Array.isArray(weakPoints)) {
    return res.status(400).json({ message: 'Missing or invalid parameters' });
  }

  try {
    const trainingPlan = await prisma.trainingPlan.create({
      data: {
        userId,
        trainingDays,
        weakPoints,
        dailySchedule: {}, // placeholder; will eventually be generated
        queueIndex: 0,
      }
    });

    res.status(200).json({ message: 'Training plan created', plan: trainingPlan });
  } catch (error) {
    console.error('Error creating training plan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
