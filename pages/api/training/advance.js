import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // This route advances the user's training plan queue by one
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId in request' });
  }

  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { userId },
    });

    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }

    const schedule = plan.dailySchedule;
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty daily schedule' });
    }

    const newIndex = (plan.queueIndex + 1) % schedule.length;

    const updatedPlan = await prisma.trainingPlan.update({
      where: { userId },
      data: { queueIndex: newIndex },
    });

    res.status(200).json({
      message: 'Training day advanced',
      queueIndex: updatedPlan.queueIndex,
    });
  } catch (error) {
    console.error('Error advancing training plan:', error);
    res.status(500).json({ message: 'Failed to advance training plan' });
  }
}