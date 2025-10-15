import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '/src/firebase/config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

export const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in.');
      } else {
        setError('Failed to authenticate. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 bg-gray-800 p-8 border border-gray-700 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-display font-bold text-center text-white mb-6">
        {isLogin ? 'Welcome Back' : 'Create an Account'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            className="shadow-sm appearance-none border border-gray-600 bg-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-blue"
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow-sm appearance-none border border-gray-600 bg-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-blue"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-brand-red text-sm mb-4">{error}</p>}
        <div className="flex items-center justify-between flex-col">
          <button
            className="w-full bg-brand-blue hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:bg-gray-600"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="mt-4 inline-block align-baseline font-bold text-sm text-blue-400 hover:text-blue-300"
          >
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
          </button>
        </div>
      </form>
    </div>
  );
};