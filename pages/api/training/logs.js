import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
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
  } else if (req.method === 'POST') {
    const { userId, dayIndex, exercises } = req.body;

    if (!userId || dayIndex === undefined || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'Missing or invalid input' });
    }

    try {
      const log = await prisma.trainingLog.create({
        data: {
          userId,
          dayIndex,
          exercises,
        },
      });

      // Trigger nutrition update
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nutrition/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      return res.status(200).json({ message: 'Training log saved', log });
    } catch (error) {
      console.error('Error saving training log:', error);
      return res.status(500).json({ error: 'Failed to save log' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}