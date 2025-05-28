'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // State to store raindrop data, initially empty to avoid SSR mismatch
  const [raindrops, setRaindrops] = useState<{ left: string; animationDelay: string }[]>([]);

  // Generate raindrop data only on the client side
  useEffect(() => {
    const numberOfRaindrops = 100; // Adjust as needed
    const newRaindrops = Array.from({ length: numberOfRaindrops }, () => ({
      left: `${Math.random() * 100}%`, // Random position between 0% and 100%
      animationDelay: `${Math.random() * 2}s`, // Random delay between 0s and 2s
    }));
    setRaindrops(newRaindrops);
  }, []); // Empty dependency array ensures this runs once on mount, on the client

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-200 to-gray-300 overflow-hidden">
      {/* Raindrop animation */}
      <div className="absolute inset-0">
        {raindrops.map((drop, index) => (
          <div
            key={index}
            style={{
              left: drop.left,
              animationDelay: drop.animationDelay,
            }}
            className="absolute w-1 h-4 bg-blue-400 rounded-full raindrop animate-fall"
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Welcome to Journey Planner</h1>
        <p className="text-lg text-gray-600 max-w-md">
          Plan your trips with real-time weather insights and AI-driven recommendations.
        </p>
        <a
          href="/dashboard"
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Get Started
        </a>
      </div>

      {/* CSS for raindrop animation */}
      <style jsx>{`
        .raindrop {
          position: absolute;
          top: -20px;
          width: 2px;
          height: 12px;
          background: rgba(147, 197, 253, 0.8);
          border-radius: 9999px;
          animation: fall linear infinite;
        }

        @keyframes fall {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}