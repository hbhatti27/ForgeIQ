import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    userId,
    frontPhotoUrl,
    sidePhotoUrl,
    backPhotoUrl,
    bodyFat,
    leanBodyMass,
    date,
  } = req.body;

  if (!userId || !frontPhotoUrl || !sidePhotoUrl || !backPhotoUrl) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const saved = await prisma.workoutLog.create({
      data: {
        userId,
        day: 0,
        completed: false,
        exercises: {
          frontPhotoUrl,
          sidePhotoUrl,
          backPhotoUrl,
          bodyFat,
          leanBodyMass,
          date: date || new Date().toISOString(),
        },
      },
    });

    res.status(200).json({ message: 'Check-in saved', saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save check-in', error: err.message });
  }
}