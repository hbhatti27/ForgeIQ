import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Trigger nutrition update after training log is saved
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nutrition/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (nutritionError) {
      console.error('Failed to update nutrition plan after training log:', nutritionError);
    }

    res.status(200).json({ success: true, log });
  } catch (error) {
    console.error('Error saving training log:', error);
    res.status(500).json({ error: 'Failed to save training log' });
  }
}

export default async function fetchLogsHandler(req, res) {
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