import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

export default function Signup() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState('basic');

  const plans = {
    basic: {
      title: 'Basic',
      monthly: 29,
      annual: 299,
      features: ['AI Nutrition Coaching', 'AI Training Programs']
    },
    premium: {
      title: 'Premium',
      monthly: 59,
      annual: 637,
      features: ['Everything in Basic', 'Progress Tracking Dashboard', 'Priority Support', 'AI Coach Access']
    }
  };

  const handleCheckout = async () => {
    console.log('✅ Continue button clicked');
    console.log('Selected Plan:', selectedPlan);
    console.log('Billing Cycle:', billingCycle);
    console.log('Stripe Publishable Key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, billingCycle }),
      });

      const data = await res.json();
      console.log('Stripe Session Response:', data);

      if (!data.sessionId) {
        alert('Failed to initiate checkout. Please verify your Stripe setup.');
        return;
      }

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) {
        alert('Stripe.js failed to load.');
        return;
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        console.error('Stripe Redirect Error:', result.error.message);
        alert('Stripe redirect failed: ' + result.error.message);
      }
    } catch (err) {
      console.error('Checkout Error:', err);
      alert('Something went wrong with checkout: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="ForgeIQ Logo" className="h-20" />
      </div>
      <div className="flex justify-center mb-4">
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/user/role', {
                headers: {
                  'x-user-email': localStorage.getItem('userEmail') || '',
                }
              });
              const data = await res.json();
 
              if (data.role === 'admin' || data.role === 'premium' || data.role === 'basic') {
                window.location.href = '/dashboard';
              } else {
                alert('Access denied. Please complete your registration or sign up first.');
              }
            } catch (err) {
              console.error('Login check failed:', err);
              alert('Unable to verify login. Please try again.');
            }
          }}
          className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          Log In
        </button>
      </div>
      <h1 className="text-3xl font-bold text-center text-orange-500 mb-6">Choose Your Plan</h1>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 mx-2 rounded-full text-sm font-semibold transition-colors ${billingCycle === 'monthly' ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-gray-300'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`px-4 py-2 mx-2 rounded-full text-sm font-semibold transition-colors ${billingCycle === 'annual' ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-gray-300'}`}
        >
          Annual
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            onClick={() => setSelectedPlan(key)}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-transform transform hover:scale-105 ${selectedPlan === key ? 'border-orange-500 bg-zinc-800' : 'border-zinc-700 bg-zinc-900'}`}
          >
            <h2 className="text-xl font-bold text-orange-400 mb-2">{plan.title}</h2>
            <p className="text-3xl font-extrabold mb-4">
              ${billingCycle === 'monthly' ? plan.monthly : plan.annual}
              <span className="text-sm font-medium ml-1">/ {billingCycle}</span>
            </p>
            <ul className="text-sm space-y-1 mb-4">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="text-gray-300">• {feature}</li>
              ))}
            </ul>
            <button
              className={`w-full py-2 rounded-md font-semibold transition-colors ${selectedPlan === key ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-gray-300'}`}
            >
              {selectedPlan === key ? 'Selected' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={handleCheckout}
          className="bg-orange-600 hover:bg-orange-700 transition-colors text-white px-6 py-3 rounded-full font-semibold text-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}