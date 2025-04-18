import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, id } = req.body;

  if (!userId || !id) {
    return res.status(400).json({ error: 'Missing userId or workout id' });
  }

  try {
    await prisma.customWorkout.deleteMany({
      where: {
        id,
        userId,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
}
