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
    <div className="min-h-screen bg-light-1 dark:bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            build.me
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="input"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="input"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {login.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">Invalid email or password</p>
            </div>
          )}

          <Button type="submit" loading={login.isPending} className="w-full justify-center">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-400">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
