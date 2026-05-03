import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useRegisterMutation } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import { RegisterRequest } from '@/types'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function Register() {
  const register_ = useRegisterMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterRequest>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="min-h-screen bg-light-1 dark:bg-surface-0 flex relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-brand-500/8 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-accent-500/6 dark:bg-accent-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">build.me</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create your account</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Start your free plan — no card needed</p>
          </div>

          {/* Benefits banner */}
          <div className="flex justify-center gap-4 mb-6 text-xs text-gray-500 dark:text-gray-400">
            {['7 platforms', 'AI captions', 'Free forever'].map((b) => (
              <span key={b} className="flex items-center gap-1">
                <svg className="text-brand-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {b}
              </span>
            ))}
          </div>

          <div className="card shadow-card dark:shadow-card-dark">
            <form onSubmit={handleSubmit((data) => register_.mutate(data))} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="John Doe"
                  className="input"
                  autoComplete="name"
                />
                {errors.fullName && <p className="text-red-400 text-xs mt-1.5">{errors.fullName.message}</p>}
              </div>

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
                  placeholder="Min. 8 characters"
                  className="input"
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {register_.error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <svg className="text-red-400 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <p className="text-red-400 text-sm">Registration failed. Email may already be in use.</p>
                </div>
              )}

              <Button type="submit" variant="gradient" loading={register_.isPending} className="w-full justify-center mt-1">
                Create free account
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            By signing up, you agree to our{' '}
            <span className="text-brand-500 cursor-pointer hover:text-brand-600">Terms</span> &amp;{' '}
            <span className="text-brand-500 cursor-pointer hover:text-brand-600">Privacy Policy</span>
          </p>

          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
