import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, messages } = req.body;
  if (!userId || !messages) {
    return res.status(400).json({ message: 'Missing userId or messages' });
  }

  try {
    await prisma.chatHistory.upsert({
      where: { userId },
      update: { messages: JSON.stringify(messages), updatedAt: new Date() },
      create: {
        userId,
        messages: JSON.stringify(messages),
        updatedAt: new Date()
      }
    });

    res.status(200).json({ message: 'Chat history saved' });
  } catch (err) {
    console.error('[CHAT_SAVE_ERROR]', err);
    res.status(500).json({ message: 'Failed to save chat history' });
  }
}
