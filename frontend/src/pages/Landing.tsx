import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'
import { useThemeStore } from '@/store/themeStore'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Content Calendar',
    desc: 'Drag-and-drop scheduling across all platforms. Never miss a posting window.',
    accent: 'brand',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="19" cy="5" r="3"/><line x1="19" y1="3" x2="19" y2="7"/><line x1="17" y1="5" x2="21" y2="5"/>
      </svg>
    ),
    title: 'Smart Scheduler',
    desc: 'AI-powered optimal posting times. Exponential backoff retry for failed posts.',
    accent: 'blue',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: 'AI Caption Generator',
    desc: 'GPT-4o powered captions with hashtags, emojis, and platform-specific tone.',
    accent: 'orange',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: 'Deep Analytics',
    desc: 'Track impressions, engagement, reach, saves, and clicks per platform.',
    accent: 'green',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    title: 'Media Library',
    desc: 'Upload images and videos, organize assets, reuse across posts and campaigns.',
    accent: 'brand',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Team Workspaces',
    desc: 'Multiple workspaces with role-based access. Perfect for agencies and teams.',
    accent: 'blue',
  },
]

const platforms = [
  { name: 'Instagram', color: '#E1306C', icon: '📸' },
  { name: 'TikTok', color: '#000000', icon: '🎵' },
  { name: 'Facebook', color: '#1877F2', icon: '👥' },
  { name: 'Twitter/X', color: '#1DA1F2', icon: '🐦' },
  { name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  { name: 'YouTube', color: '#FF0000', icon: '▶️' },
  { name: 'Pinterest', color: '#E60023', icon: '📌' },
]

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['1 workspace', '30 posts/month', '3 platforms', 'Basic analytics', 'Media library'],
    cta: 'Get Started',
    cta_variant: 'secondary' as const,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/month',
    features: ['3 workspaces', 'Unlimited posts', 'All 7 platforms', 'AI captions', 'Advanced analytics', '3 team seats'],
    cta: 'Start Free Trial',
    cta_variant: 'gradient' as const,
    popular: true,
  },
  {
    name: 'Agency',
    price: '₹1,499',
    period: '/month',
    features: ['Unlimited workspaces', 'Unlimited posts', 'All platforms', '10 team seats', 'White-label reports', 'Priority support'],
    cta: 'Contact Sales',
    cta_variant: 'secondary' as const,
  },
]

const stats = [
  { value: '10K+', label: 'Active creators' },
  { value: '2M+', label: 'Posts scheduled' },
  { value: '7', label: 'Platforms' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const accentMap: Record<string, string> = {
  brand: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
  blue: 'bg-accent-500/10 text-accent-500 border-accent-500/20',
  green: 'bg-success-500/10 text-success-500 border-success-500/20',
  orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
}

export default function Landing() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-light-0 dark:bg-surface-0">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-surface-0/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">build.me</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#platforms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Platforms</a>
            <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register">
              <Button variant="gradient" size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/8 dark:bg-brand-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-accent-500/6 dark:bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/20 text-brand-600 dark:text-brand-400 rounded-full text-xs font-semibold px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
              The all-in-one social media command center
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-7 leading-[1.1] tracking-tight">
              Plan, Schedule &{' '}
              <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-accent-400 bg-clip-text text-transparent">
                Grow
              </span>
              <br />your Social Presence
            </h1>

            <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Build.me unifies all your social channels in one powerful workspace — with AI captions,
              visual scheduling, deep analytics, and media management.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button variant="gradient" size="lg" rightIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                }>
                  Start for Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  View Demo
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 mt-4">No credit card required. Free forever plan available.</p>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 px-6 border-y border-light-3 dark:border-white/5 bg-light-1 dark:bg-surface-1">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl font-bold bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Everything you need to grow
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              A complete toolkit built for modern creators, marketers, and agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="card group hover:shadow-md dark:hover:shadow-card-dark hover:border-brand-500/20 dark:hover:border-brand-500/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${accentMap[f.accent]}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section id="platforms" className="py-24 px-6 bg-light-1 dark:bg-surface-1">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            7 platforms, one workspace
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
            Post to every major platform from a single composer. No tab switching, no re-uploading.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {platforms.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-2.5 bg-white dark:bg-surface-2 border border-light-3 dark:border-white/8 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-2xl">{p.icon}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{p.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Start free. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`card relative ${
                  plan.popular
                    ? 'border-brand-500/40 dark:border-brand-500/40 ring-1 ring-brand-500/20'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-brand">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <div>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{plan.price}</span>
                    <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="text-brand-500 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/register">
                  <Button variant={plan.cta_variant} className="w-full justify-center">
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-light-1 dark:bg-surface-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
            Ready to grow your{' '}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              social presence?
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Join thousands of creators and brands using build.me every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="gradient" size="lg">Get Started for Free</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Sign in</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-light-3 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">build.me</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Build.me. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
