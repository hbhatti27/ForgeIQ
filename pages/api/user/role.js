import { getAuth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ role: 'unauthorized' });
  }

  try {
    const userEmail = req.headers['x-user-email'];

    if (userEmail === 'sim.bhatti.l@gmail.com') {
      // Auto-promote and assign premium for admin
      await prisma.user.upsert({
        where: { email: userEmail },
        update: { role: 'admin', subscription: 'premium' },
        create: { id: userId, email: userEmail, role: 'admin', subscription: 'premium' }
      });

      return res.status(200).json({ role: 'admin', subscriptionStatus: 'premium' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ role: 'not_found' });
    }

    return res.status(200).json({ role: user.role });
  } catch (err) {
    console.error('[GET_USER_ROLE]', err);
    return res.status(500).json({ role: 'error' });
  }
}
