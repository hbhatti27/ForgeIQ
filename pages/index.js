import { useEffect, useState } from 'react';

export default function WelcomeLogin() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 3000); // 3-second shimmer animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {!showLogin ? (
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 rounded-full overflow-hidden mb-4">
            <img
              src="/logo.png"
              alt="ForgeIQ Logo"
              className="w-full h-full object-contain relative z-10"
            />
            <div
              className="absolute inset-0 rounded-full border-4 border-orange-500 bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500 opacity-70 animate-ping"
            />
          </div>
          <h1 className="text-2xl text-orange-500 font-bold tracking-wide">
            Welcome to ForgeIQ. The Next Evolution in Fitness.
          </h1>
        </div>
      ) : (
        <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl">
          <h2 className="text-white text-2xl font-semibold mb-6">Log In</h2>
          <form className="flex flex-col space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-3 rounded-md bg-zinc-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="password"
              placeholder="Password"
              className="px-4 py-3 rounded-md bg-zinc-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 transition-colors py-3 rounded-md font-semibold text-white"
            >
              Continue
            </button>
            <p className="text-sm text-gray-400 text-center">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-orange-400 hover:underline">
                Sign Up
              </a>
            </p>
          </form>
        </div>
      )}
    </div>
  );
}