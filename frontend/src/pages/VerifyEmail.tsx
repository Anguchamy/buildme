import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '@/api/axios'

type State = 'loading' | 'success' | 'error'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token found in the link.')
      return
    }
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setState('success')
        setTimeout(() => navigate('/login'), 2000)
      })
      .catch((err) => {
        setState('error')
        setMessage(err?.response?.data?.message ?? 'The link is invalid or has expired.')
      })
  }, [token])

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

        {state === 'loading' && (
          <div className="card space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto animate-pulse">
              <svg className="text-brand-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Verifying your email…</p>
          </div>
        )}

        {state === 'success' && (
          <div className="card space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <svg className="text-green-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Email verified!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your account is active. Redirecting you to login…</p>
            </div>
            <Link to="/login" className="block w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl text-center hover:opacity-90 transition-opacity">
              Go to Login
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="card space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <svg className="text-red-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verification failed</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
            </div>
            <Link to="/login" className="block text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
