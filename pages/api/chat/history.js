

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const record = await prisma.chatHistory.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const messages = record ? JSON.parse(record.messages) : [];
    return res.status(200).json({ messages });
  } catch (err) {
    console.error('[CHAT_HISTORY_ERROR]', err);
    return res.status(500).json({ message: 'Failed to load chat history' });
  }
}