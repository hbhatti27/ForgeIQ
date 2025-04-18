import { useState } from 'react';
import { useRouter } from 'next/router';

export default function GoalSetting() {
  const router = useRouter();
  const [goalWeight, setGoalWeight] = useState('');
  const [goalBodyFat, setGoalBodyFat] = useState('');
  const [trainingDays, setTrainingDays] = useState('');

  const handleContinue = () => {
    if (!goalWeight || !goalBodyFat || !trainingDays) {
      alert('Please complete all fields.');
      return;
    }

    localStorage.setItem('goalWeight', goalWeight);
    localStorage.setItem('goalBodyFat', goalBodyFat);
    localStorage.setItem('trainingDays', trainingDays);

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-3xl font-bold text-orange-500 mb-6">Set Your Goals</h1>

      <div className="w-full max-w-md space-y-6">
        <div>
          <label className="block mb-2 font-semibold">Ideal Body Weight (lbs)</label>
          <input
            type="number"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., 185"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Target Body Fat %</label>
          <input
            type="number"
            step="0.1"
            value={goalBodyFat}
            onChange={(e) => setGoalBodyFat(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., 12.5"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Training Days per Week</label>
          <select
            value={trainingDays}
            onChange={(e) => setTrainingDays(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select...</option>
            {[...Array(7)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} days</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleContinue}
          className="w-full mt-6 bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-md font-semibold text-lg"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}