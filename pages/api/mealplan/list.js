import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const plans = await prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ plans });
  } catch (error) {
    console.error('[GET_MEALPLAN_LIST]', error);
    return res.status(500).json({ message: 'Failed to fetch meal plans' });
  }
}