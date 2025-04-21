import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing userId or message' });
  }

  try {
    await prisma.consultMessage.create({
      data: {
        userId,
        message,
        sender: 'admin',
      }
    });
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user?.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_SENDER,
          pass: process.env.EMAIL_PASSWORD,
        }
      });

      await transporter.sendMail({
        from: `"ForgeIQ Coach" <${process.env.EMAIL_SENDER}>`,
        to: user.email,
        subject: 'You have a new reply from your ForgeIQ Coach',
        text: `You have received a new reply regarding your anabolic consultation:\n\n"${message}"\n\nPlease log in to your ForgeIQ dashboard to view and respond.`
      });
    }

    return res.status(200).json({ message: 'Reply saved successfully' });
  } catch (err) {
    console.error('[ADMIN_REPLY_ERROR]', err);
    return res.status(500).json({ error: 'Failed to save reply' });
  }
}
