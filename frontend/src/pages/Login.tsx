import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useLoginMutation } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import { LoginRequest } from '@/types'
import api from '@/api/axios'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

/* ── Floating orb ── */
function Orb({ style }: { style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%',
      filter: 'blur(80px)', pointerEvents: 'none', ...style,
    }} />
  )
}

export default function Login() {
  const login = useLoginMutation()
  const [resendEmail, setResendEmail] = useState<string | null>(null)
  const [resendSent, setResendSent] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<LoginRequest>({
    resolver: zodResolver(schema),
  })

  const isEmailNotVerified = (login.error as any)?.response?.status === 403

  const handleResend = async () => {
    const email = resendEmail ?? getValues('email')
    await api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`)
    setResendSent(true)
  }

  /* 3D card tilt */
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`
  }
  const onMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = ''
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#03040a', position: 'relative', overflow: 'hidden', padding: 24,
    }}>
      {/* Ambient orbs */}
      <Orb style={{ width: 600, height: 600, top: '-20%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)' }} />
      <Orb style={{ width: 400, height: 400, bottom: '-10%', right: '-5%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }} />
      <Orb style={{ width: 300, height: 300, bottom: '20%', left: '-5%', background: 'radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%)' }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(168,85,247,0.08) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #9333ea, #a855f7 50%, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(147,51,234,0.5), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #c084fc, #22d3ee)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>build.me</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.7)' }}>Sign in to your workspace</p>
        </div>

        {/* 3D Card */}
        <div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{
            borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(145deg, #111827 0%, #070b14 100%)',
            border: '1px solid rgba(168,85,247,0.15)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
            transition: 'transform 0.12s ease',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Top sheen */}
          <div style={{
            position: 'absolute', inset: '0 0 auto', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            pointerEvents: 'none',
          }} />
          {/* Corner glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 120, height: 120,
            background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <form onSubmit={handleSubmit((data) => login.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input" autoComplete="email" />
              {errors.email && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="input"
                  style={{ paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.5)', padding: 0,
                  }}
                >
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{errors.password.message}</p>}
            </div>

            {/* Error states */}
            {login.error && !isEmailNotVerified && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 12, padding: '10px 14px',
              }}>
                <svg style={{ color: '#f87171', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p style={{ color: '#f87171', fontSize: 13 }}>Invalid email or password</p>
              </div>
            )}

            {isEmailNotVerified && (
              <div style={{
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 500 }}>Please verify your email before logging in.</p>
                {resendSent
                  ? <p style={{ color: '#34d399', fontSize: 12 }}>Verification email sent! Check your inbox.</p>
                  : <button type="button" onClick={() => { setResendEmail(getValues('email')); handleResend() }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', fontSize: 12, fontWeight: 600, textAlign: 'left', padding: 0, textDecoration: 'underline' }}>
                      Resend verification email
                    </button>
                }
              </div>
            )}

            <Button type="submit" variant="gradient" loading={login.isPending} className="w-full" size="lg" glow>
              Sign in
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{
            background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            fontWeight: 700, textDecoration: 'none',
          }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
