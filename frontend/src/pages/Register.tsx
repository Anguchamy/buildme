import { useState, useRef } from 'react'
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

function Orb({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', ...style }} />
}

export default function Register() {
  const register_ = useRegisterMutation()
  const [showPass, setShowPass] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<RegisterRequest>({
    resolver: zodResolver(schema),
  })

  /* 3D tilt */
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`
  }
  const onMouseLeave = () => { if (cardRef.current) cardRef.current.style.transform = '' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-app)', position: 'relative', overflow: 'hidden', padding: 24,
    }}>
      {/* Ambient orbs */}
      <Orb style={{ width: 600, height: 600, top: '-20%', right: '10%', background: 'radial-gradient(circle, rgba(28,26,255,0.16) 0%, transparent 70%)' }} />
      <Orb style={{ width: 500, height: 500, bottom: '-15%', left: '-5%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)' }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(28,26,255,0.08) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20, textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #1d4ed8, #1C1AFF 50%, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(28,26,255,0.5), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #1C1AFF, #0ea5e9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>build.me</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 6 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Free forever · No card needed</p>
        </div>

        {/* Benefit chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {['7 platforms', 'AI captions', 'Free forever'].map(b => (
            <span key={b} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, color: '#34d399',
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)',
              padding: '4px 10px', borderRadius: 99,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {b}
            </span>
          ))}
        </div>

        {/* Success state */}
        {register_.isSuccess && (
          <div style={{
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 16, textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>🎉 Account created!</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              We sent a verification link to <strong style={{ color: 'var(--text-2)' }}>{getValues('email')}</strong>.<br />
              Please check your inbox before signing in.
            </p>
          </div>
        )}

        {/* 3D Card */}
        <div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{
            borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden',
            background: 'var(--bg-elev-1)',
            border: '1px solid rgba(28,26,255,0.15)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
            transition: 'transform 0.12s ease',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Top sheen */}
          <div style={{ position: 'absolute', inset: '0 0 auto', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', pointerEvents: 'none' }} />
          {/* Corner glow */}
          <div style={{ position: 'absolute', top: -40, left: -40, width: 120, height: 120, background: 'radial-gradient(circle, rgba(28,26,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <form onSubmit={handleSubmit((data) => register_.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label className="label">Full Name</label>
              <input {...register('fullName')} type="text" placeholder="John Doe" className="input" autoComplete="name" />
              {errors.fullName && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input" autoComplete="email" />
              {errors.email && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="input"
                  style={{ paddingRight: 40 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0 }}
                >
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{errors.password.message}</p>}
            </div>

            {register_.error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '10px 14px' }}>
                <svg style={{ color: '#f87171', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p style={{ color: '#f87171', fontSize: 13 }}>Registration failed. Email may already be in use.</p>
              </div>
            )}

            <Button type="submit" variant="gradient" loading={register_.isPending} className="w-full" size="lg" glow>
              Create free account
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', marginTop: 12 }}>
          By signing up you agree to our{' '}
          <span style={{ color: '#1C1AFF', cursor: 'pointer' }}>Terms</span> &amp;{' '}
          <span style={{ color: '#1C1AFF', cursor: 'pointer' }}>Privacy Policy</span>
        </p>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 16 }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            background: 'linear-gradient(135deg, #1C1AFF, #0ea5e9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            fontWeight: 700, textDecoration: 'none',
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
