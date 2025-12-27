import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'rgb(var(--background))' }}>
      <div className="w-full max-w-md">
        <div className="shadow-lg rounded-lg p-8 text-center" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
          <div className="w-16 h-16 bg-error-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-error-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--foreground))' }}>Authentication Error</h2>
          <p className="mb-6" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            There was a problem signing you in. Please try again.
          </p>
          <Link
            href={ROUTES.LOGIN}
            className="inline-block bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
