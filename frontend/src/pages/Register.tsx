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
    <div className="min-h-screen bg-light-1 dark:bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            build.me
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start your free trial today</p>
        </div>

        <form onSubmit={handleSubmit((data) => register_.mutate(data))} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...register('fullName')} type="text" placeholder="John Doe" className="input" />
            {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input {...register('password')} type="password" placeholder="Min 8 characters" className="input" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {register_.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">Registration failed. Email may already be in use.</p>
            </div>
          )}

          <Button type="submit" loading={register_.isPending} className="w-full justify-center">
            Create account
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>

        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-400">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
