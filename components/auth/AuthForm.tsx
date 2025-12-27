'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { AccountType } from '@/types';
import { Mail, Lock, Building2, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('brand');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, accountType }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error(signInResult.error);
        }

        router.push(ROUTES.ONBOARDING);
      } else {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Invalid email or password');
        }

        router.push(ROUTES.DASHBOARD);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-secondary-600">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 pl-11 rounded-xl transition-all duration-200 border border-secondary-200 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              style={{ backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--foreground))' }}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-secondary-600">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 pl-11 rounded-xl transition-all duration-200 border border-secondary-200 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              style={{ backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--foreground))' }}
              placeholder="Enter your password"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div>
            <label htmlFor="accountType" className="block text-sm font-medium mb-1.5 text-secondary-600">
              Account Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-secondary-400" />
              </div>
              <select
                id="accountType"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full px-4 py-3 pl-11 rounded-xl transition-all duration-200 border border-secondary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none appearance-none cursor-pointer"
                style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
              >
                <option value="brand">Brand Account</option>
                <option value="agency">Agency Account</option>
                <option value="enterprise">Enterprise Account</option>
              </select>
            </div>
            <p className="mt-1.5 text-sm text-secondary-500">Choose the type that best fits your needs</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-error-50 border border-error-100">
            <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0" />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary btn-lg w-full group"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="spinner-sm border-white/30 border-t-white" />
              Processing...
            </div>
          ) : (
            <>
              {mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-secondary-100">
        <p className="text-sm text-center text-secondary-600">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={mode === 'login' ? ROUTES.REGISTER : ROUTES.LOGIN}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
