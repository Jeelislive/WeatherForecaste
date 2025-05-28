'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect authenticated users to /
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  const registerPromise = axios.post('/api/auth/register', {
    name,
    email,
    password,
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  toast.promise(
    registerPromise,
    {
      loading: 'Registering...',
      success: 'Signup successful! Redirecting...',
      error: (err) =>
        axios.isAxiosError(err)
          ? err.response?.data?.error || 'Signup failed.'
          : 'Something went wrong.',
    }
  );

  try {
    const response = await registerPromise;

    if (response.status === 201) {
      router.push('/login');
    }
  } catch (err) {
    // Error is already handled by toast, but you can still log or store it
    if (axios.isAxiosError(err)) {
      setError(err.response?.data?.error || 'Signup failed.');
    } else {
      setError('Something went wrong.');
    }
  }
};


  if (status === 'loading') {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-gray-200">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Sign Up</h2>
        {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition duration-200"
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition duration-200"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition duration-200"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}