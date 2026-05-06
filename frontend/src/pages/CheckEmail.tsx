import { Link, useLocation } from 'react-router-dom'

export default function CheckEmail() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email ?? 'your email'

  return (
    <div className="min-h-screen bg-light-1 dark:bg-surface-0 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">build.me</span>
        </Link>

        <div className="card space-y-5">
          <div className="w-14 h-14 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto">
            <svg className="text-brand-500" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check your inbox</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              We sent a verification link to <br />
              <strong className="text-gray-700 dark:text-gray-200">{email}</strong>
            </p>
            <p className="text-sm text-gray-400 mt-3">
              Click the link in the email to activate your account. The link expires in 24 hours.
            </p>
          </div>

          <div className="pt-1 border-t border-gray-100 dark:border-surface-2 text-sm text-gray-400">
            Already verified?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Didn't receive it? Check your spam folder or{' '}
          <Link to="/login" className="text-brand-500 hover:text-brand-600 transition-colors">
            try signing in
          </Link>{' '}
          to resend.
        </p>
      </div>
    </div>
  )
}
