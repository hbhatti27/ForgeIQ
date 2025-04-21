import Image from 'next/image';
import Link from 'next/link';

import { useState } from 'react';
import { useRouter } from 'next/router';

export default function IntakeStepOne() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: ''
  });

  const ageOptions = Array.from({ length: 78 }, (_, i) => 13 + i);
  const heightOptions = Array.from({ length: 28 }, (_, i) => {
    const inches = 57 + i;
    const feet = Math.floor(inches / 12);
    const remaining = inches % 12;
    return `${feet}&rsquo;${remaining}"`;
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.age || !formData.gender || !formData.height || !formData.weight) {
      alert('Please complete all fields');
      return;
    }
    // Save to localStorage or context if needed
    router.push('/intake/front-photo');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-3xl font-bold text-orange-500 mb-6">Biometric Intake</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div>
          <label className="block mb-2 font-semibold">Age</label>
          <select name="age" value={formData.age} onChange={handleChange} required className="w-full px-4 py-2 bg-zinc-900 text-white rounded">
            <option value="">Select Age</option>
            {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-2 bg-zinc-900 text-white rounded">
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Height</label>
          <select name="height" value={formData.height} onChange={handleChange} required className="w-full px-4 py-2 bg-zinc-900 text-white rounded">
            <option value="">Select Height</option>
            {heightOptions.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Weight (lbs)</label>
          <input type="number" name="weight" value={formData.weight} onChange={handleChange} required min="50" max="700" className="w-full px-4 py-2 bg-zinc-900 text-white rounded" />
        </div>

        <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-semibold">
          Continue
        </button>
      </form>
    </div>
  );
}
