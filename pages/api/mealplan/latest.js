import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const latest = await prisma.mealPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!latest) {
      return res.status(404).json({ message: 'No saved meal plan found' });
    }

    return res.status(200).json({ plan: JSON.parse(latest.data) });
  } catch (error) {
    console.error('[GET_LATEST_MEALPLAN]', error);
    return res.status(500).json({ message: 'Failed to fetch latest meal plan' });
  }
}
