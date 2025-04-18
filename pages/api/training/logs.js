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
    const logs = await prisma.trainingLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    res.status(200).json({ logs });
  } catch (error) {
    console.error('Error fetching training logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}