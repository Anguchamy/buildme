import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'
import DemoModal from '@/components/common/DemoModal'
import { useThemeStore } from '@/store/themeStore'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

const features = [
  { icon: '📅', title: 'Content Calendar', desc: 'Plan and schedule posts across all platforms from one place' },
  { icon: '⊞', title: 'Grid Planner', desc: 'Visualize and design your Instagram grid before posting' },
  { icon: '✨', title: 'AI Caption Generator', desc: 'Generate compelling captions with GPT-4o in seconds' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Track performance metrics across all your social platforms' },
  { icon: '🔗', title: '7 Platforms', desc: 'Instagram, TikTok, Facebook, Twitter, LinkedIn, YouTube, Pinterest' },
  { icon: '🖼️', title: 'Media Library', desc: 'Upload, organize, and reuse your images and videos across posts' },
]

const plans = [
  {
    name: 'Free', price: '₹0', period: 'forever',
    features: ['1 workspace', '30 posts/month', '3 platforms', 'Basic analytics'],
    cta: 'Get Started',
  },
  {
    name: 'Pro', price: '₹499', period: '/month',
    features: ['3 workspaces', 'Unlimited posts', 'All 7 platforms', 'AI captions', 'Advanced analytics'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Agency', price: '₹1,499', period: '/month',
    features: ['Unlimited workspaces', 'Unlimited posts', 'All platforms', 'Team access', 'White-label reports'],
    cta: 'Contact Sales',
  },
]

export default function Landing() {
  const [demoOpen, setDemoOpen] = useState(false)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-light-0 dark:bg-surface-0">
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-light-0/80 dark:bg-surface-0/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            build.me
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Login</Link>
            <Link to="/register">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 bg-brand-500/20 text-brand-500 rounded-full text-sm mb-6">
              🚀 The all-in-one social media planner
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Plan, Schedule & Grow<br />
              <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
                Your Social Presence
              </span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Build.me helps creators and brands manage content across 7 platforms with AI-powered captions,
              visual grid planning, and deep analytics.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register">
                <Button size="lg">Start for Free</Button>
              </Link>
              <Button variant="secondary" size="lg" onClick={() => setDemoOpen(true)}>
                ▶ Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Everything you need to grow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card hover:border-brand-500/30 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-light-1 dark:bg-surface-1">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card relative ${plan.popular ? 'border-brand-500/50 bg-brand-500/5' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-500 text-white text-xs rounded-full font-semibold">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-green-500 dark:text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    className="w-full justify-center"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-black/5 dark:border-white/5 text-center text-sm text-gray-400">
        <p>© 2026 Build.me. All rights reserved.</p>
      </footer>
    </div>
  )
}
