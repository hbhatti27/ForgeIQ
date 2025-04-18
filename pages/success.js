import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/intake');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center px-4">
      <img src="/logo.png" alt="ForgeIQ Logo" className="h-24 mb-6" />
      <h1 className="text-3xl font-bold text-orange-500 mb-4">Payment Successful!</h1>
      <p className="text-lg text-gray-300 mb-2">
        Thank you for subscribing to ForgeIQ. Redirecting to your dashboard...
      </p>
      <p className="text-sm text-gray-500">
        If you're not redirected, <a href="/dashboard" className="text-orange-400 underline">click here</a>.
      </p>
    </div>
  );
}