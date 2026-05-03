import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useLoginMutation } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import { LoginRequest } from '@/types'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

export default function Login() {
  const login = useLoginMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="min-h-screen bg-light-1 dark:bg-surface-0 flex relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/8 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-accent-500/6 dark:bg-accent-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">build.me</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Sign in to your workspace</p>
          </div>

          <div className="card shadow-card dark:shadow-card-dark space-y-5">
            <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="input"
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Enter your password"
                  className="input"
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {login.error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <svg className="text-red-400 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <p className="text-red-400 text-sm">Invalid email or password</p>
                </div>
              )}

              <Button type="submit" variant="gradient" loading={login.isPending} className="w-full justify-center mt-1">
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
