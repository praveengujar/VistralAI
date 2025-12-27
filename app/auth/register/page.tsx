import AuthForm from '@/components/auth/AuthForm';
import { APP_NAME } from '@/lib/constants';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-100/40 rounded-full blur-2xl" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 group">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow duration-300">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">{APP_NAME}</h1>
            <p className="text-secondary-500">AI Exposure Optimization Platform</p>
          </div>

          {/* Auth Form Card */}
          <div className="card p-8 backdrop-blur-xl bg-white/80">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">Create your account</h2>
              <p className="text-sm text-secondary-500 mt-1">Start optimizing your brand&apos;s AI presence</p>
            </div>
            <AuthForm mode="register" />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-secondary-400 mt-6">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
