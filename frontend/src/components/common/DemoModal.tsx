import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { classNames } from '@/utils/helpers'

function XMark() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ─── Individual slide screens ───────────────────────────────────────────────

function DashboardSlide() {
  const stats = [
    { label: 'Total Posts', value: '128', icon: '📝', color: 'from-brand-500/20 to-brand-600/10' },
    { label: 'Scheduled', value: '24', icon: '📅', color: 'from-purple-500/20 to-purple-600/10' },
    { label: 'Published', value: '96', icon: '✅', color: 'from-green-500/20 to-green-600/10' },
    { label: 'Impressions', value: '48.2K', icon: '👁️', color: 'from-orange-500/20 to-orange-600/10' },
  ]
  const posts = [
    { bg: 'bg-gradient-to-br from-pink-500/30 to-purple-500/30', label: 'Instagram', status: 'Published' },
    { bg: 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30', label: 'LinkedIn', status: 'Scheduled' },
    { bg: 'bg-gradient-to-br from-red-500/30 to-orange-500/30', label: 'YouTube', status: 'Draft' },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={classNames('rounded-xl p-3 bg-gradient-to-br border border-white/10', s.color)}
          >
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-lg font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-surface-1 p-3">
        <p className="text-xs font-medium text-gray-400 mb-2">Recent Posts</p>
        <div className="grid grid-cols-3 gap-2">
          {posts.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={classNames('rounded-lg h-20 flex flex-col justify-end p-2', p.bg)}
            >
              <span className="text-[10px] text-white/60">{p.label}</span>
              <span className={classNames(
                'text-[10px] font-medium mt-0.5',
                p.status === 'Published' ? 'text-green-400' :
                p.status === 'Scheduled' ? 'text-brand-400' : 'text-gray-400'
              )}>{p.status}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CalendarSlide() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const events: Record<number, { label: string; color: string }[]> = {
    1: [{ label: 'Instagram post', color: 'bg-pink-500/40' }],
    2: [{ label: 'LinkedIn article', color: 'bg-blue-500/40' }, { label: 'Twitter thread', color: 'bg-sky-500/40' }],
    4: [{ label: 'YouTube Short', color: 'bg-red-500/40' }],
    5: [{ label: 'TikTok video', color: 'bg-purple-500/40' }, { label: 'Reels', color: 'bg-pink-500/40' }],
    6: [{ label: 'Pinterest pin', color: 'bg-rose-500/40' }],
  }
  return (
    <div className="rounded-xl border border-white/10 bg-surface-1 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">March 2026</span>
        <div className="flex gap-1">
          {['Month', 'Week', 'Day'].map((v) => (
            <span key={v} className={classNames(
              'text-xs px-2 py-0.5 rounded',
              v === 'Week' ? 'bg-brand-500 text-white font-medium' : 'text-gray-400'
            )}>{v}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div key={d} className="text-center text-[10px] text-gray-500 pb-1">{d}</div>
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-lg bg-surface-2 border border-white/5 min-h-[72px] p-1"
          >
            <div className="text-[10px] text-gray-500 mb-1">{i + 10}</div>
            {(events[i] || []).map((ev) => (
              <div key={ev.label} className={classNames('text-[9px] text-white/80 rounded px-1 py-0.5 mb-0.5 truncate', ev.color)}>
                {ev.label}
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function GridPlannerSlide() {
  const cells = [
    { bg: 'from-pink-400/40 to-fuchsia-500/40', label: 'New collection' },
    { bg: 'from-orange-400/40 to-amber-500/40', label: 'Behind scenes' },
    { bg: 'from-cyan-400/40 to-blue-500/40', label: 'Product shot' },
    { bg: 'from-green-400/40 to-emerald-500/40', label: 'Team photo' },
    { bg: 'from-purple-400/40 to-violet-500/40', label: 'Quote card' },
    { bg: 'from-rose-400/40 to-pink-500/40', label: 'Reel cover' },
    { bg: 'from-sky-400/40 to-indigo-500/40', label: 'Collab post' },
    { bg: 'from-yellow-400/40 to-orange-500/40', label: 'Giveaway' },
    { bg: 'from-teal-400/40 to-cyan-500/40', label: '+ Add post', empty: true },
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center text-sm">✦</div>
        <div>
          <p className="text-sm font-medium text-white">@yourbrand</p>
          <p className="text-xs text-gray-400">Instagram Grid Preview</p>
        </div>
        <span className="ml-auto text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">Drag to reorder</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {cells.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={classNames(
              'aspect-square rounded-lg bg-gradient-to-br flex items-end p-1.5 cursor-grab',
              c.bg,
              c.empty ? 'border-2 border-dashed border-white/20 items-center justify-center' : ''
            )}
          >
            <span className={classNames('text-[10px]', c.empty ? 'text-gray-400' : 'text-white/70')}>{c.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function AICaptionSlide() {
  const suggestions = [
    '✨ Elevate your everyday with our latest collection. Crafted for the bold, designed for the fearless. Shop now → link in bio 🛍️ #fashion #newcollection #ootd',
    '🔥 New drop just landed! Our most-requested styles are finally here. Don\'t sleep on this — limited stock available. Tap to shop! 💫 #style #fashion',
    '💡 Good style isn\'t about following trends — it\'s about setting them. Introducing our SS2026 collection. Available now. #SS2026 #styleinspo',
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-white/10 bg-surface-1 p-3">
        <p className="text-xs text-gray-400 mb-2">Prompt</p>
        <div className="flex gap-2">
          <input
            readOnly
            value="New fashion collection launch, excited tone, include CTA"
            className="flex-1 text-xs bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-gray-300"
          />
          <div className="px-3 py-2 bg-brand-500 rounded-lg text-xs text-black font-medium whitespace-nowrap">
            ✨ Generate
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="rounded-xl border border-white/10 bg-surface-1 p-3 flex gap-2 cursor-pointer hover:border-brand-500/40 transition-colors"
          >
            <span className="text-xs text-gray-300 flex-1 leading-relaxed">{s}</span>
            <button className="text-[10px] text-brand-400 whitespace-nowrap self-start mt-0.5">Use this</button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsSlide() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 68]
  const platforms = [
    { name: 'Instagram', pct: 42, color: 'bg-pink-500' },
    { name: 'LinkedIn', pct: 28, color: 'bg-blue-500' },
    { name: 'TikTok', pct: 18, color: 'bg-purple-500' },
    { name: 'Twitter', pct: 12, color: 'bg-sky-500' },
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Reach', value: '124K', delta: '+18%' },
          { label: 'Engagement', value: '8.4%', delta: '+3.2%' },
          { label: 'Followers', value: '12.6K', delta: '+892' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl bg-surface-1 border border-white/10 p-3"
          >
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
            <p className="text-[10px] text-green-400 mt-1">{s.delta} this month</p>
          </motion.div>
        ))}
      </div>
      {/* Bar chart */}
      <div className="rounded-xl bg-surface-1 border border-white/10 p-3">
        <p className="text-xs text-gray-400 mb-3">Engagement over time</p>
        <div className="flex items-end gap-1 h-20">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
              style={{ height: `${h}%`, transformOrigin: 'bottom' }}
              className="flex-1 bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-sm opacity-80"
            />
          ))}
        </div>
      </div>
      {/* Platform breakdown */}
      <div className="rounded-xl bg-surface-1 border border-white/10 p-3">
        <p className="text-xs text-gray-400 mb-2">Platform breakdown</p>
        <div className="space-y-2">
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] text-gray-400 w-16">{p.name}</span>
              <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ delay: 0.6 + i * 0.07, duration: 0.6 }}
                  className={classNames('h-full rounded-full', p.color)}
                />
              </div>
              <span className="text-[10px] text-gray-400 w-8 text-right">{p.pct}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Slide config ────────────────────────────────────────────────────────────

const slides = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    heading: 'Your command center',
    sub: 'See all your content, stats, and upcoming posts at a glance.',
    component: <DashboardSlide />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: '📅',
    heading: 'Visual content calendar',
    sub: 'Drag and drop posts across days. Color-coded by platform.',
    component: <CalendarSlide />,
  },
  {
    id: 'grid',
    label: 'Grid Planner',
    icon: '⊞',
    heading: 'Instagram grid planner',
    sub: 'Visualize exactly how your feed will look before you post.',
    component: <GridPlannerSlide />,
  },
  {
    id: 'ai',
    label: 'AI Captions',
    icon: '✨',
    heading: 'AI-powered captions',
    sub: 'GPT-4o generates 3 tailored caption options in seconds.',
    component: <AICaptionSlide />,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📊',
    heading: 'Deep analytics',
    sub: 'Track reach, engagement, and follower growth across all platforms.',
    component: <AnalyticsSlide />,
  },
]

// ─── Modal ───────────────────────────────────────────────────────────────────

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      setDirection(1)
      setCurrent((c) => (c + 1) % slides.length)
    }, 5000)
    return () => clearTimeout(timer)
  }, [current, isOpen])

  // Reset on open
  useEffect(() => {
    if (isOpen) setCurrent(0)
  }, [isOpen])

  const go = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
  }

  const prev = () => go((current - 1 + slides.length) % slides.length)
  const next = () => go((current + 1) % slides.length)

  const slide = slides[current]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl bg-surface-1 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
                    build.me
                  </span>
                  <span className="text-gray-500 text-sm">— Product Tour</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-3 transition-colors"
                >
                  <XMark />
                </button>
              </div>

              <div className="flex">
                {/* Sidebar nav */}
                <div className="hidden md:flex flex-col gap-1 p-4 border-r border-white/5 min-w-[140px]">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => go(i)}
                      className={classNames(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left',
                        i === current
                          ? 'bg-brand-500/20 text-brand-400 font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-surface-3'
                      )}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col p-5 min-h-[480px]">
                  {/* Slide heading */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id + '-header'}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4"
                    >
                      <h3 className="text-lg font-semibold text-white">{slide.heading}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{slide.sub}</p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Slide body */}
                  <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={slide.id}
                        custom={direction}
                        variants={{
                          enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                          center: { opacity: 1, x: 0 },
                          exit: (d: number) => ({ opacity: 0, x: d * -40 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 overflow-y-auto"
                      >
                        {slide.component}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Footer controls */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    {/* Dots (mobile) */}
                    <div className="flex gap-1.5 md:hidden">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => go(i)}
                          className={classNames(
                            'rounded-full transition-all',
                            i === current ? 'w-4 h-1.5 bg-brand-400' : 'w-1.5 h-1.5 bg-white/20'
                          )}
                        />
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="hidden md:flex items-center gap-2 flex-1">
                      <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-brand-500 rounded-full"
                          animate={{ width: `${((current + 1) / slides.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{current + 1}/{slides.length}</span>
                    </div>

                    {/* Arrows */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={prev}
                        className="p-2 rounded-lg bg-surface-3 text-gray-400 hover:text-white transition-colors"
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        onClick={next}
                        className="p-2 rounded-lg bg-surface-3 text-gray-400 hover:text-white transition-colors"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
