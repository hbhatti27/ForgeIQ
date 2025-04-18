import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ResultsPage() {
  const router = useRouter();
  const [bodyFat, setBodyFat] = useState(null);
  const [photos, setPhotos] = useState({ front: '', side: '', back: '' });
  const [weight, setWeight] = useState(180);

  useEffect(() => {
    async function fetchBodyComposition() {
      const frontUrl = localStorage.getItem('frontPhotoUrl');
      const sideUrl = localStorage.getItem('sidePhotoUrl');
      const backUrl = localStorage.getItem('backPhotoUrl');
      const weight = parseFloat(localStorage.getItem('userWeight')) || 180;
 
      if (!frontUrl || !sideUrl || !backUrl) {
        console.error('Missing photo URLs for analysis');
        setBodyFat('Error');
        return;
      }
 
      try {
        const res = await fetch('/api/analyze-photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frontUrl,
            sideUrl,
            backUrl,
            weight,
          }),
        });
 
        const data = await res.json();
        if (res.ok && data.bodyFat) {
          localStorage.setItem('bodyFat', data.bodyFat);
          localStorage.setItem('leanBodyMass', (weight * (1 - parseFloat(data.bodyFat) / 100)).toFixed(1));
          localStorage.setItem('frontPhotoUrl', frontUrl);
          setBodyFat(data.bodyFat);
          const newCheckin = {
            date: new Date().toISOString(),
            frontPhotoUrl: frontUrl,
            sidePhotoUrl: sideUrl,
            backPhotoUrl: backUrl,
            bodyFat: data.bodyFat,
            leanBodyMass: (weight * (1 - parseFloat(data.bodyFat) / 100)).toFixed(1)
          };
          
          const existing = JSON.parse(localStorage.getItem('checkinHistory') || '[]');
          existing.push(newCheckin);
          localStorage.setItem('checkinHistory', JSON.stringify(existing));
        } else {
          console.error('Analysis failed:', data.error);
          setBodyFat('Error');
        }
      } catch (err) {
        console.error('Request error:', err);
        setBodyFat('Error');
      }
    }
 
    const userWeight = parseFloat(localStorage.getItem('userWeight')) || 180;
    setWeight(userWeight);
    fetchBodyComposition();
    setPhotos({
      front: localStorage.getItem('frontPhotoUrl'),
      side: localStorage.getItem('sidePhotoUrl'),
      back: localStorage.getItem('backPhotoUrl'),
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-3xl font-bold text-orange-500 mb-4">AI Body Composition Analysis</h1>
      {bodyFat ? (
        <>
          <div className="flex flex-col items-center md:flex-row gap-4 mb-6">
            <img src={photos.front} alt="Front" className="w-40 h-auto rounded border border-gray-700" />
            <img src={photos.side} alt="Side" className="w-40 h-auto rounded border border-gray-700" />
            <img src={photos.back} alt="Back" className="w-40 h-auto rounded border border-gray-700" />
          </div>
          <div className="mt-4 p-4 rounded bg-zinc-800 border border-orange-500 text-sm text-orange-300 text-center max-w-md mx-auto">
            Note: Body fat and lean mass estimates are based on visual analysis and may vary by ±2–3%.
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg text-left w-full max-w-md mb-6">
            <p className="text-lg mb-2"><span className="font-semibold text-orange-400">Estimated Body Fat:</span> {bodyFat}%</p>
            <p className="text-lg"><span className="font-semibold text-orange-400">Estimated Lean Body Mass:</span> {(weight * (1 - parseFloat(bodyFat) / 100)).toFixed(1)} lbs</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded font-semibold"
          >
            Continue to Dashboard
          </button>
        </>
      ) : (
        <p className="text-lg text-gray-400 animate-pulse">Generating results...</p>
      )}
    </div>
  );
}