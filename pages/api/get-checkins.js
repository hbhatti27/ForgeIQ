import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const checkins = await prisma.workoutLog.findMany({
      where: {
        userId,
        completed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ checkins });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
}
