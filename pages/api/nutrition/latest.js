import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const latest = await prisma.nutritionLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (!latest) {
      return res.status(404).json({ message: 'No nutrition log found' });
    }

    return res.status(200).json({ data: latest });
  } catch (error) {
    console.error('[GET_LATEST_NUTRITION]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
