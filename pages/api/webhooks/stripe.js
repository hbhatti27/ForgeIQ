

import { buffer } from 'micro';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const priceId = session.items?.data[0]?.price?.id;

      if (userId) {
        const role = priceId === process.env.STRIPE_PREMIUM_PRICE_ID ? 'premium' : 'basic';

        await prisma.user.update({
          where: { id: userId },
          data: { role }
        });

        console.log(`User ${userId} role updated to ${role}`);
      }
      break;
    }

    // Optionally handle subscription updates if needed
    case 'customer.subscription.updated': {
      // Add logic here for role downgrades or upgrades
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}