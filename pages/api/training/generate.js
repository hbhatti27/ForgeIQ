import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const sampleExercises = {
  back: [
    { name: 'Lat Pulldown', sets: 3, reps: [10, 12], image: '/images/lat-pulldown.png' },
    { name: 'Barbell Row', sets: 3, reps: [8, 10], image: '/images/barbell-row.png' }
  ],
  chest: [
    { name: 'Flat Bench Press', sets: 4, reps: [6, 8], image: '/images/bench-press.png' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: [10, 12], image: '/images/incline-dumbbell-press.png' }
  ],
  legs: [
    { name: 'Barbell Squat', sets: 4, reps: [8, 10], image: '/images/barbell-squat.png' },
    { name: 'Leg Curl', sets: 3, reps: [12, 15], image: '/images/leg-curl.png' }
  ],
  shoulders: [
    { name: 'Overhead Press', sets: 3, reps: [8, 10], image: '/images/overhead-press.png' },
    { name: 'Lateral Raise', sets: 3, reps: [12, 15], image: '/images/lateral-raise.png' }
  ],
  arms: [
    { name: 'Barbell Curl', sets: 3, reps: [10, 12], image: '/images/barbell-curl.png' },
    { name: 'Tricep Pushdown', sets: 3, reps: [10, 12], image: '/images/tricep-pushdown.png' }
  ],
  abs: [
    { name: 'Cable Crunch', sets: 3, reps: [15, 20], image: '/images/cable-crunch.png' },
    { name: 'Plank', sets: 3, reps: [30, 45], image: '/images/plank.png' }
  ]
};

function generateWorkoutDay(focus) {
  return {
    name: `Focus: ${focus}`,
    exercises: sampleExercises[focus] || []
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, trainingDays, weakPoints } = req.body;

  if (!userId || !trainingDays || !Array.isArray(weakPoints)) {
    return res.status(400).json({ message: 'Missing or invalid parameters' });
  }

  try {
    const plan = [];

    // Prioritize weak points
    weakPoints.slice(0, trainingDays).forEach((focus) => {
      plan.push(generateWorkoutDay(focus));
    });

    // Fill remaining days with balanced groups
    const fallbackFocus = ['chest', 'legs', 'shoulders', 'arms', 'abs'];
    let i = 0;
    while (plan.length < trainingDays) {
      const focus = fallbackFocus[i % fallbackFocus.length];
      plan.push(generateWorkoutDay(focus));
      i++;
    }

    // Update training plan
    const updated = await prisma.trainingPlan.update({
      where: { userId },
      data: {
        dailySchedule: plan,
        queueIndex: 0
      }
    });

    res.status(200).json({ message: 'Training plan generated', plan: updated });
  } catch (error) {
    console.error('Failed to generate plan:', error);
    res.status(500).json({ message: 'Failed to generate training plan' });
  }
}