import { useRef } from 'react'

interface Props {
  label: string
  value: string | number
  change?: number
  icon: string
  accent?: 'brand' | 'green' | 'blue' | 'orange'
}

const accentConfig = {
  brand:  { from: '#1d4ed8', to: '#1C1AFF', glow: 'rgba(28,26,255,0.35)',   ring: 'rgba(28,26,255,0.2)',   badge: 'rgba(28,26,255,0.12)',  light: '#60a5fa' },
  green:  { from: '#059669', to: '#34d399', glow: 'rgba(52,211,153,0.35)',  ring: 'rgba(52,211,153,0.2)',  badge: 'rgba(52,211,153,0.12)', light: '#6ee7b7' },
  blue:   { from: '#0369a1', to: '#0ea5e9', glow: 'rgba(14,165,233,0.35)',  ring: 'rgba(14,165,233,0.2)',  badge: 'rgba(14,165,233,0.12)', light: '#7dd3fc' },
  orange: { from: '#d97706', to: '#fbbf24', glow: 'rgba(251,191,36,0.35)',  ring: 'rgba(251,191,36,0.2)',  badge: 'rgba(251,191,36,0.12)', light: '#fde68a' },
}

export default function StatsCard({ label, value, change, icon, accent = 'brand' }: Props) {
  const cfg = accentConfig[accent]
  const cardRef = useRef<HTMLDivElement>(null)

  /* ── 3D tilt on mouse move ── */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5   // -0.5 → 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px)`
    el.style.boxShadow = `
      ${x * -20}px ${y * -20}px 60px ${cfg.glow},
      0 28px 80px rgba(0,0,0,0.6),
      0 0 0 1px ${cfg.ring},
      inset 0 1px 0 rgba(255,255,255,0.07)
    `
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    el.style.transform = ''
    el.style.boxShadow = `
      0 1px 0 rgba(255,255,255,0.05) inset,
      0 16px 48px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.04)
    `
  }

  const isDark = document.documentElement.classList.contains('dark')

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        borderRadius: '1rem',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        background: 'var(--bg-elev-1)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Light mode override */}
      <style>{`
        html:not(.dark) .sc-wrap-${accent} {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.07) !important;
          box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 20px rgba(0,0,0,0.07) !important;
        }
      `}</style>
      <div className={`sc-wrap-${accent}`} style={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }} />

      {/* Ambient glow blob */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '60%', height: '60%',
        background: `radial-gradient(ellipse, ${cfg.glow.replace('0.35','0.15')} 0%, transparent 70%)`,
        pointerEvents: 'none',
        filter: 'blur(20px)',
      }} />

      {/* Top-left corner accent line */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(to bottom, ${cfg.from}, ${cfg.to})`,
        borderRadius: '0 2px 2px 0',
        boxShadow: `0 0 12px ${cfg.glow}`,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', paddingLeft: '0.5rem' }}>
        {/* Row: icon + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem',
            background: cfg.badge,
            border: `1px solid ${cfg.ring}`,
            boxShadow: `0 4px 12px ${cfg.glow.replace('0.35','0.2')}`,
          }}>
            {icon}
          </div>

          {change !== undefined && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '0.5rem',
              color: change >= 0 ? '#34d399' : '#f87171',
              background: change >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
              border: `1px solid ${change >= 0 ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
            }}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>
          )}
        </div>

        {/* Value */}
        <p style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: '0.25rem',
          background: `linear-gradient(135deg, #fff 0%, ${cfg.light} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {value}
        </p>
        <p style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.02em' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
