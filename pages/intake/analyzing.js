

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AnalyzingScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/intake/results');
    }, 4000); // simulate AI analysis delay
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center px-4">
      <h1 className="text-4xl font-extrabold text-orange-500 animate-pulse mb-6">Analyzing...</h1>
      <p className="text-lg text-gray-400 animate-pulse">Processing physique data with AI</p>
    </div>
  );
}