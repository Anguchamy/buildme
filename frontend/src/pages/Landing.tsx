import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'
import { useThemeStore } from '@/store/themeStore'

/* ── Helpers ─────────────────────────────────────────────── */
function Orb({ style, className }: { style: React.CSSProperties; className?: string }) {
  return <div className={className} style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none', ...style }} />
}

function AnimatedCounter({ end, suffix = '', duration = 2200 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setCount(Math.floor(e * end))
      if (p < 1) requestAnimationFrame(step)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [end, duration])
  return <>{count.toLocaleString()}{suffix}</>
}

/* ── Mock UI previews (floating 3D cards in hero) ────────── */
function MockCalendar() {
  const posts = [
    { day: 0, icon: '📸', color: '#E1306C', label: 'Instagram post' },
    { day: 1, icon: '💼', color: '#0A66C2', label: 'LinkedIn article' },
    { day: 2, icon: '🐦', color: '#1DA1F2', label: 'Twitter thread' },
    { day: 3, icon: '📸', color: '#E1306C', label: 'Reel' },
    { day: 4, icon: '▶️', color: '#FF0000', label: 'YouTube short' },
  ]
  return (
    <div style={{
      background: 'var(--bg-elev-1)',
      border: '1px solid rgba(28,26,255,0.2)', borderRadius: 16,
      padding: 16, width: 272,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 80px rgba(0,0,0,0.15), 0 0 40px rgba(28,26,255,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>June 2026</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#f87171','#fbbf24','#34d399'].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 10 }}>
        {['M','T','W','T','F'].map((d, i) => (
          <div key={i}>
            <p style={{ fontSize: 9, color: 'var(--text-4)', textAlign: 'center', marginBottom: 4 }}>{d}</p>
            <div style={{
              aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              background: posts[i] ? `${posts[i].color}22` : 'var(--bg-elev-2)',
              border: posts[i] ? `1px solid ${posts[i].color}40` : '1px solid rgba(255,255,255,0.06)',
              boxShadow: posts[i] ? `0 0 10px ${posts[i].color}30` : 'none',
            }}>
              {posts[i]?.icon ?? ''}
            </div>
          </div>
        ))}
      </div>
      {posts.slice(0,3).map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, marginBottom: 4,
          background: 'var(--bg-elev-2)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 12 }}>{p.icon}</span>
          <span style={{ fontSize: 10, color: 'var(--text-2)', flex: 1 }}>{p.label}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 5px', borderRadius: 4 }}>✓</span>
        </div>
      ))}
    </div>
  )
}

function MockAnalytics() {
  const bars = [35, 55, 42, 78, 52, 92, 68]
  return (
    <div style={{
      background: 'var(--bg-elev-1)',
      border: '1px solid rgba(14,165,233,0.2)', borderRadius: 16,
      padding: 16, width: 214,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 80px rgba(0,0,0,0.15), 0 0 40px rgba(14,165,233,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>Analytics</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', padding: '2px 7px', borderRadius: 6 }}>▲ 24%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60, marginBottom: 6 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '3px 3px 0 0',
            height: `${h}%`,
            background: i === 5
              ? 'linear-gradient(to top, #1C1AFF, #0ea5e9)'
              : i === 6 ? 'rgba(28,26,255,0.25)' : 'rgba(28,26,255,0.12)',
            boxShadow: i === 5 ? '0 0 10px rgba(28,26,255,0.6)' : 'none',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: 'var(--text-4)', flex: 1, textAlign: 'center' }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[{l:'Reach',v:'24.5K',c:'#1C1AFF'},{l:'Likes',v:'3.2K',c:'#0ea5e9'}].map(s => (
          <div key={s.l} style={{ background: 'var(--bg-elev-2)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: s.c, textShadow: `0 0 12px ${s.c}60` }}>{s.v}</p>
            <p style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 1 }}>{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockComposer() {
  return (
    <div style={{
      background: 'var(--bg-elev-1)',
      border: '1px solid rgba(28,26,255,0.2)', borderRadius: 16,
      padding: 14, width: 232,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 80px rgba(0,0,0,0.15), 0 0 40px rgba(28,26,255,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#1C1AFF,#0ea5e9)', boxShadow: '0 0 10px rgba(28,26,255,0.5)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', flex: 1 }}>AI Caption</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#1C1AFF', background: 'rgba(28,26,255,0.12)', padding: '2px 6px', borderRadius: 6, border: '1px solid rgba(28,26,255,0.2)' }}>GPT-4o</span>
      </div>
      <div style={{ background: 'rgba(28,26,255,0.06)', borderRadius: 10, padding: 10, marginBottom: 10, border: '1px solid rgba(28,26,255,0.12)' }}>
        <p style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.6 }}>
          ✨ Elevate your Monday with this game-changing strategy! Drop a 🔥 if you agree...
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {['#growth','#marketing','#strategy'].map(h => (
          <span key={h} style={{ fontSize: 9, fontWeight: 600, color: '#1C1AFF', background: 'rgba(28,26,255,0.1)', padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(28,26,255,0.2)' }}>{h}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {['📸','🐦','💼'].map(icon => (
          <div key={icon} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elev-2)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{icon}</div>
        ))}
        <button style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg,#1C1AFF,#0ea5e9)', padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 0 12px rgba(28,26,255,0.4)' }}>Post</button>
      </div>
    </div>
  )
}

/* ── Data ─────────────────────────────────────────────────── */
const features = [
  { icon: '📅', title: 'Content Calendar', desc: 'Drag-and-drop scheduling across all platforms. Never miss a posting window.', color: '#1C1AFF' },
  { icon: '⏱️', title: 'Smart Scheduler', desc: 'AI-powered optimal posting times with automatic retry for failed posts.', color: '#0ea5e9' },
  { icon: '✨', title: 'AI Caption Generator', desc: 'GPT-4o powered captions with hashtags, emojis, and platform-specific tone.', color: '#3b82f6' },
  { icon: '📊', title: 'Deep Analytics', desc: 'Track impressions, engagement, reach, saves, and clicks per platform.', color: '#34d399' },
  { icon: '🖼️', title: 'Media Library', desc: 'Upload, organize, and reuse images & videos across posts and campaigns.', color: '#fbbf24' },
  { icon: '👥', title: 'Team Workspaces', desc: 'Multiple workspaces with role-based access for agencies and teams.', color: '#1d4ed8' },
]

const platforms = [
  { name: 'Instagram', color: '#E1306C', icon: '📸' },
  { name: 'TikTok',    color: '#69C9D0', icon: '🎵' },
  { name: 'Facebook',  color: '#1877F2', icon: '👥' },
  { name: 'Twitter/X', color: '#1DA1F2', icon: '🐦' },
  { name: 'LinkedIn',  color: '#0A66C2', icon: '💼' },
  { name: 'YouTube',   color: '#FF0000', icon: '▶️' },
  { name: 'Pinterest', color: '#E60023', icon: '📌' },
]

const plans = [
  { name: 'Free', price: '₹0', period: 'forever', features: ['1 workspace','30 posts/month','3 platforms','Basic analytics','Media library'], cta: 'Get Started', gradient: null },
  { name: 'Pro',  price: '₹499', period: '/month', features: ['3 workspaces','Unlimited posts','All 7 platforms','AI captions','Advanced analytics','3 team seats'], cta: 'Start Free Trial', gradient: 'linear-gradient(135deg,#1d4ed8,#1C1AFF 50%,#0ea5e9)', popular: true },
  { name: 'Agency', price: '₹1,499', period: '/month', features: ['Unlimited workspaces','Unlimited posts','All platforms','10 team seats','White-label reports','Priority support'], cta: 'Contact Sales', gradient: null },
]

const stats = [
  { value: 10000, suffix: '+', label: 'Active creators' },
  { value: 2000000, suffix: '+', label: 'Posts scheduled' },
  { value: 7, suffix: '',   label: 'Platforms supported' },
  { value: 99, suffix: '.9%', label: 'Uptime SLA' },
]

const testimonials = [
  { name: 'Priya Sharma',  role: 'Content Creator',       avatar: '👩🏽',      text: 'Build.me saved me 10 hours a week. The AI captions alone are worth every rupee.' },
  { name: 'Rohan Mehta',   role: 'Digital Agency Owner',  avatar: '👨🏽‍💼',   text: "Managing 15 clients from one dashboard? That's insane value. My team loves it." },
  { name: 'Anjali Rao',    role: 'Brand Strategist',      avatar: '👩🏽‍💻',   text: 'The Instagram grid planner is brilliant. Our aesthetic has never been more consistent.' },
]

export default function Landing() {
  const { theme, toggleTheme } = useThemeStore()
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % testimonials.length), 4000)
    return () => clearInterval(t)
  }, [])

  /* Subtle parallax on hero orbs */
  const onHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current; if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const x = (e.clientX / width  - 0.5) * 20
    const y = (e.clientY / height - 0.5) * 20
    el.querySelectorAll<HTMLElement>('.parallax-orb').forEach((orb, i) => {
      const factor = (i + 1) * 0.4
      orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`
    })
  }

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-1)',
        display: 'flex', alignItems: 'center', padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #1d4ed8, #1C1AFF 50%, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(28,26,255,0.4)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#1C1AFF,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              build.me
            </span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 28, fontSize: 13, color: 'var(--text-3)' }} className="hidden md:flex">
            {['Features','Platforms','Pricing','Reviews'].map(label => (
              <a key={label} href={`#${label.toLowerCase()}`} style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1C1AFF')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >{label}</a>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggleTheme} style={{
              padding: 8, borderRadius: 8, background: 'var(--bg-elev-2)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#1C1AFF'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(28,26,255,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(15,23,42,0.10)' }}
            >
              {theme === 'dark'
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
            <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
            >Login</Link>
            <Link to="/register"><Button variant="gradient" size="sm">Get Started Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section ref={heroRef} onMouseMove={onHeroMouseMove}
        style={{ paddingTop: 128, paddingBottom: 0, position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(28,26,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,26,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Badge + headline */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
            style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(28,26,255,0.08)', border: '1px solid rgba(28,26,255,0.2)',
              borderRadius: 99, padding: '6px 16px', marginBottom: 28,
              fontSize: 12, fontWeight: 700, color: '#1C1AFF',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1C1AFF', boxShadow: '0 0 8px rgba(28,26,255,0.8)', animation: 'glowPulse 2s ease-in-out infinite', display: 'inline-block' }} />
              The all-in-one social media command center
            </div>

            <h1 style={{ fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 24, color: 'var(--text-1)' }}>
              Plan, Schedule &{' '}
              <span style={{ background: 'linear-gradient(135deg, #1C1AFF, #3b82f6 40%, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Grow
              </span>
              <br />your Social Presence
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text-2)', marginBottom: 36, maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Build.me unifies all your social channels in one powerful workspace — AI captions, visual scheduling, deep analytics, and media management.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <Link to="/register"><Button variant="gradient" size="lg" glow rightIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}>Start for Free</Button></Link>
              <Link to="/login"><Button variant="glass" size="lg">View Demo</Button></Link>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 64 }}>No credit card required · Free forever plan available</p>
          </motion.div>

          {/* Floating UI cards */}
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 360 }}>
            {/* Bottom fade */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to top, var(--bg-app), transparent)', zIndex: 10, pointerEvents: 'none' }} />

            {/* Center card */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.16,1,0.3,1] }}
              style={{ position: 'absolute', zIndex: 5, animation: 'float 7s ease-in-out infinite', bottom: 40 }}>
              <MockCalendar />
            </motion.div>

            {/* Left card */}
            <motion.div initial={{ opacity: 0, x: -60, y: 30 }} animate={{ opacity: 0.92, x: 0, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: [0.16,1,0.3,1] }}
              className="hidden sm:block"
              style={{ position: 'absolute', left: '4%', bottom: 60, zIndex: 3, animation: 'float 9s ease-in-out 1s infinite', transform: 'rotate(-3deg)' }}>
              <MockAnalytics />
            </motion.div>

            {/* Right card */}
            <motion.div initial={{ opacity: 0, x: 60, y: 30 }} animate={{ opacity: 0.92, x: 0, y: 0 }} transition={{ delay: 0.7, duration: 0.8, ease: [0.16,1,0.3,1] }}
              className="hidden sm:block"
              style={{ position: 'absolute', right: '4%', bottom: 70, zIndex: 3, animation: 'float 8s ease-in-out 2s infinite', transform: 'rotate(3deg)' }}>
              <MockComposer />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px', borderTop: '1px solid rgba(28,26,255,0.1)', borderBottom: '1px solid rgba(28,26,255,0.1)', background: 'rgba(28,26,255,0.02)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#1C1AFF,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                <AnimatedCounter end={s.value} suffix={s.suffix} />
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1C1AFF', background: 'rgba(28,26,255,0.1)', padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(28,26,255,0.2)', display: 'inline-block', marginBottom: 16 }}>Features</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 12 }}>Everything you need to grow</h2>
            <p style={{ fontSize: 16, color: 'var(--text-3)', maxWidth: 500, margin: '0 auto' }}>A complete toolkit built for modern creators, marketers, and agencies.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                style={{
                  borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden',
                  background: 'var(--bg-elev-1)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 48px rgba(0,0,0,0.5)',
                  cursor: 'default', transition: 'all 0.3s ease',
                }}
                whileHover={{ y: -4, boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, 0 28px 80px rgba(0,0,0,0.6), 0 0 0 1px ${f.color}30, 0 0 40px ${f.color}10` }}
              >
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${f.color}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{
                  width: 44, height: 44, borderRadius: 12, fontSize: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${f.color}15`, border: `1px solid ${f.color}30`,
                  boxShadow: `0 0 16px ${f.color}20`, marginBottom: 16,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platforms ─────────────────────────────────────────── */}
      <section id="platforms" style={{ padding: '96px 24px', background: 'rgba(28,26,255,0.02)', borderTop: '1px solid rgba(28,26,255,0.08)', borderBottom: '1px solid rgba(28,26,255,0.08)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22d3ee', background: 'rgba(34,211,238,0.08)', padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(34,211,238,0.2)', display: 'inline-block', marginBottom: 16 }}>Integrations</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 12 }}>7 platforms, one workspace</h2>
            <p style={{ fontSize: 16, color: 'var(--text-3)', marginBottom: 48, maxWidth: 480, margin: '0 auto 48px' }}>Post to every major platform from a single composer. No tab switching, no re-uploading.</p>
          </motion.div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {platforms.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.06, y: -2 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg-elev-2)', border: `1px solid ${p.color}30`,
                  borderRadius: 14, padding: '10px 18px', cursor: 'default',
                  boxShadow: `0 0 20px ${p.color}15`,
                  transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 22 }}>{p.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{p.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section id="reviews" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(52,211,153,0.08)', padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(52,211,153,0.2)', display: 'inline-block', marginBottom: 16 }}>Testimonials</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>Loved by creators</h2>
          </motion.div>

          <div style={{ height: 140, position: 'relative' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
                style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ fontSize: 18, color: 'var(--text-2)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 20 }}>"{testimonials[activeTestimonial].text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{testimonials[activeTestimonial].avatar}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{testimonials[activeTestimonial].name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{testimonials[activeTestimonial].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} style={{
                height: 6, borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                width: i === activeTestimonial ? 24 : 6,
                background: i === activeTestimonial ? '#1C1AFF' : 'rgba(148,163,184,0.2)',
                boxShadow: i === activeTestimonial ? '0 0 10px rgba(28,26,255,0.6)' : 'none',
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '96px 24px', background: 'rgba(28,26,255,0.02)', borderTop: '1px solid rgba(28,26,255,0.08)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(251,191,36,0.2)', display: 'inline-block', marginBottom: 16 }}>Pricing</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 10 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 16, color: 'var(--text-3)' }}>Start free. Upgrade when you're ready.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20, paddingTop: 16 }}>
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                style={{
                  borderRadius: 20, padding: 28, position: 'relative',
                  background: plan.popular ? 'linear-gradient(145deg, rgba(28,26,255,0.10), rgba(28,26,255,0.03))' : 'var(--bg-elev-1)',
                  border: plan.popular ? '1px solid rgba(28,26,255,0.35)' : '1px solid var(--border-2)',
                  boxShadow: plan.popular ? '0 12px 32px rgba(28,26,255,0.15), 0 4px 12px rgba(28,26,255,0.08)' : '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
                }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                    <span style={{
                      background: '#1C1AFF', color: 'white',
                      fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 99,
                      boxShadow: '0 4px 12px rgba(28,26,255,0.35)',
                      whiteSpace: 'nowrap', letterSpacing: '0.02em',
                    }}>Most Popular</span>
                  </div>
                )}

                <div style={{ marginBottom: 20, marginTop: plan.popular ? 10 : 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>{plan.name}</h3>
                  <div>
                    <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-1)', lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-4)', marginLeft: 4 }}>{plan.period}</span>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-2)' }}>
                      <span style={{ color: '#34d399', fontSize: 12 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <Link to="/register">
                  <Button variant={plan.popular ? 'gradient' : 'glass'} className="w-full" size="md" glow={!!plan.popular}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <Orb style={{ width: 700, height: 700, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(28,26,255,0.12) 0%, transparent 65%)' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 24px',
            background: 'linear-gradient(135deg,#1d4ed8,#1C1AFF 50%,#0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(28,26,255,0.4), 0 8px 24px rgba(28,26,255,0.2)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>
            <span style={{ color: 'var(--text-1)' }}>Ready to grow your </span>
            <span style={{ background: 'linear-gradient(135deg,#1C1AFF,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>social presence?</span>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-3)', marginBottom: 32, lineHeight: 1.7 }}>
            Join thousands of creators and brands using build.me every day.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register"><Button variant="gradient" size="lg" glow>Get Started for Free</Button></Link>
            <Link to="/login"><Button variant="glass" size="lg">Sign in</Button></Link>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 16 }}>No credit card · Cancel anytime · Free forever plan</p>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{ padding: '24px', borderTop: '1px solid rgba(28,26,255,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'linear-gradient(135deg,#1C1AFF,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(28,26,255,0.4)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg,#1C1AFF,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>build.me</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Features','Pricing','Privacy','Terms'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: 'var(--text-4)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
              >{l}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-4)' }}>© 2026 Build.me. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
