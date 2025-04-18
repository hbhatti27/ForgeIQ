import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { plan, billingCycle } = req.body;

  console.log('Received plan:', plan);
  console.log('Received billingCycle:', billingCycle);
  console.log('Using Stripe key:', process.env.STRIPE_SECRET_KEY);

  const priceIds = {
    basic: {
      monthly: 'price_1REfKKRsf1h8tvwKjblNDISy',
      annual: 'price_1REfKdRsf1h8tvwKXhr5lxAr',
    },
    premium: {
      monthly: 'price_1REfKbRsf1h8tvwK550jZVjY',
      annual: 'price_1REfKZRsf1h8tvwK7Fv1Ys16',
    },
  };

  try {
    const session = await stripe.checkout.sessions.create({
      metadata: {
        selected_plan: plan,
        billing_cycle: billingCycle,
      },
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceIds[plan][billingCycle],
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/signup`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe Session Error:', err);
    res.status(500).json({ error: err.message });
  }
}