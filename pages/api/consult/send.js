import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing userId or message' });
  }

  try {
    const saved = await prisma.consultMessage.create({
      data: {
        userId,
        message,
        sender: 'user',
      }
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD,
      }
    });

    await transporter.sendMail({
      from: `"ForgeIQ Consulting" <${process.env.EMAIL_SENDER}>`,
      to: 'nexcoach27@gmail.com',
      subject: `New Anabolic Consultation Request [${saved.id}]`,
      text: `User ID: ${userId}\n\nMessage:\n${message}\n\nReply in your dashboard.`,
    });

    return res.status(200).json({ message: 'Email sent' });
  } catch (err) {
    console.error('[EMAIL_SEND_ERROR]', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}