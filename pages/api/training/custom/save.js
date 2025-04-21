

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, name, exercises } = req.body;

  if (!userId || !name || !Array.isArray(exercises)) {
    return res.status(400).json({ error: 'Missing or invalid input' });
  }

  try {
    const saved = await prisma.customWorkout.create({
      data: {
        userId,
        name,
        exercises,
      },
    });

    res.status(200).json({ success: true, workout: saved });
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).json({ error: 'Failed to save workout' });
  }
}