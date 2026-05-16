'use client'
import Link from 'next/link'
import { Clock, BarChart2, Sparkles, Users, Zap, Shield, ArrowRight, Check, Play, ChevronRight } from 'lucide-react'

const FEATURES = [
  {
    icon: Clock,
    title: 'Real-time Tracking',
    desc: 'Start, pause, and stop timers instantly. Never lose a billable minute again.',
    color: '#6366f1',
  },
  {
    icon: BarChart2,
    title: 'Powerful Reports',
    desc: 'Beautiful charts and breakdowns. Export and share with clients in one click.',
    color: '#8b5cf6',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    desc: 'Ask your data anything. Get smart suggestions to improve team productivity.',
    color: '#06b6d4',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Invite your team, assign roles, and manage projects across organizations.',
    color: '#10b981',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Optimized for speed. From timer start to report — everything feels instant.',
    color: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    desc: 'JWT auth, refresh token rotation, rate limiting. Your data stays safe.',
    color: '#ec4899',
  },
]

const STATS = [
  { value: '10K+', label: 'Active teams' },
  { value: '2M+',  label: 'Hours tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'User rating' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for individuals getting started.',
    features: ['Unlimited time entries', 'Up to 3 projects', 'Basic reports', 'Google sign-in'],
    cta: 'Get started free',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per seat / mo',
    desc: 'For teams that need more power.',
    features: ['Everything in Free', 'Unlimited projects', 'AI insights', 'Team management', 'Priority support'],
    cta: 'Start free trial',
    href: '/auth/register',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    desc: 'For large organizations with specific needs.',
    features: ['Everything in Pro', 'SSO / SAML', 'Custom integrations', 'SLA guarantee', 'Dedicated support'],
    cta: 'Contact sales',
    href: '/auth/register',
    highlight: false,
  },
]

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'CTO, Momentum Labs', body: 'TrackFlow transformed how our team manages time. We ship 40% faster now and have full visibility into where hours go.' },
  { name: 'James R.', role: 'Founder, PixelForge', body: 'The AI insights blew my mind. It literally told me which project was eating too much time before I even noticed.' },
  { name: 'Aisha M.', role: 'Head of Ops, Clarity Inc.', body: 'Setup took 5 minutes. Reports that used to take hours now run in seconds. Absolutely worth it.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg-primary))' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgb(var(--bg-primary) / 0.85)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl animated-gradient flex items-center justify-center shadow-lg animate-float">
            <Clock size={15} className="text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight gradient-text">TrackFlow</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
            style={{ color: 'rgb(var(--text-muted))' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgb(var(--text-base))')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgb(var(--text-muted))')}>
            Sign in
          </Link>
          <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 65%)' }} />
          <div className="absolute top-32 left-1/4 w-96 h-96 rounded-full opacity-10 animate-float"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDelay: '1s' }} />
          <div className="absolute top-32 right-1/4 w-80 h-80 rounded-full opacity-10 animate-float"
            style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', animationDelay: '2s' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            <Sparkles size={11} />
            AI-powered time tracking — now in beta
            <ChevronRight size={11} />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6 max-w-4xl mx-auto">
            Track time.<br />
            <span className="gradient-text">Ship smarter.</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
            The modern time tracker for teams that care about productivity, clarity, and getting things done.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="btn-primary text-base px-7 py-3.5 animate-pulse-glow">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login"
              className="flex items-center gap-2 text-sm font-medium px-6 py-3.5 rounded-xl transition-all"
              style={{ color: 'rgb(var(--text-muted))', background: 'var(--border)', border: '1px solid var(--border-strong)' }}>
              <Play size={13} fill="currentColor" />
              Already have an account
            </Link>
          </div>

          <p className="text-xs mt-5" style={{ color: 'rgb(var(--text-faint))' }}>
            No credit card required · Free forever on solo plan · Setup in 2 minutes
          </p>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative mt-20 w-full max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: '1px solid var(--border)', background: 'rgb(var(--bg-secondary))' }}>
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgb(var(--bg-elevated))', borderBottom: '1px solid var(--border)' }}>
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <div className="flex-1 mx-4 px-3 py-1 rounded text-xs text-center" style={{ background: 'var(--border)', color: 'rgb(var(--text-faint))' }}>
                app.trackflow.io/tracker
              </div>
            </div>
            {/* Fake dashboard */}
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Today', value: '6h 42m', color: '#6366f1' },
                { label: 'This week', value: '31h 15m', color: '#8b5cf6' },
                { label: 'Billable', value: '28h 00m', color: '#10b981' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'rgb(var(--bg-card))', border: '1px solid var(--border)' }}>
                  <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-faint))' }}>{label}</p>
                </div>
              ))}
              <div className="col-span-3 rounded-xl p-4" style={{ background: 'rgb(var(--bg-card))', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-base))' }}>Active Timer</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold" style={{ color: '#34d399' }}>02:14:33</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full w-3/4 animated-gradient" />
                </div>
              </div>
            </div>
          </div>
          {/* Glow under card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full blur-2xl opacity-30"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────── */}
      <section className="py-12 border-y" style={{ borderColor: 'var(--border)', background: 'rgb(var(--bg-secondary))' }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center animate-fade-in">
              <p className="text-3xl font-bold gradient-text">{value}</p>
              <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-faint))' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: 'rgb(var(--accent))' }}>EVERYTHING YOU NEED</p>
            <h2 className="text-4xl font-bold text-white mb-4">Built for modern teams</h2>
            <p className="text-lg max-w-md mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
              Every feature you need to track, analyze, and improve how your team works.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <div
                key={title}
                className="card p-6 card-glow animate-fade-in-up"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6" style={{ background: 'rgb(var(--bg-secondary))' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: 'rgb(var(--accent))' }}>LOVED BY TEAMS</p>
            <h2 className="text-4xl font-bold text-white mb-4">Don&apos;t just take our word for it</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, body }, i) => (
              <div key={name} className="card p-6 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-sm leading-relaxed mb-5 italic" style={{ color: 'rgb(var(--text-muted))' }}>&ldquo;{body}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full animated-gradient flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{name}</p>
                    <p className="text-[11px]" style={{ color: 'rgb(var(--text-faint))' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: 'rgb(var(--accent))' }}>SIMPLE PRICING</p>
            <h2 className="text-4xl font-bold text-white mb-4">Start free, scale when ready</h2>
            <p className="text-lg" style={{ color: 'rgb(var(--text-muted))' }}>No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 items-start">
            {PLANS.map(({ name, price, period, desc, features, cta, href, highlight }, i) => (
              <div
                key={name}
                className={`card p-7 animate-fade-in-up ${highlight ? 'card-glow' : ''}`}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  ...(highlight ? { borderColor: 'rgba(99,102,241,0.5)', boxShadow: '0 0 0 1px rgba(99,102,241,0.2), 0 20px 60px rgba(99,102,241,0.15)' } : {}),
                }}
              >
                {highlight && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-4"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Sparkles size={10} />Most popular
                  </div>
                )}
                <p className="text-sm font-semibold mb-1" style={{ color: 'rgb(var(--text-faint))' }}>{name}</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-4xl font-bold text-white">{price}</span>
                  {price !== 'Custom' && <span className="text-xs mb-1.5" style={{ color: 'rgb(var(--text-faint))' }}>{period}</span>}
                </div>
                <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-muted))' }}>{desc}</p>
                <ul className="space-y-2.5 mb-7">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.2)' }}>
                        <Check size={9} style={{ color: '#818cf8' }} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={href} className={highlight ? 'btn-primary w-full justify-center py-3' : 'btn-ghost w-full justify-center py-3'}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: 'rgb(var(--bg-secondary))' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(ellipse at center, #6366f1 0%, transparent 65%)' }} />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl animated-gradient flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
            <Clock size={28} className="text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Ready to take control of your time?</h2>
          <p className="text-lg mb-8" style={{ color: 'rgb(var(--text-muted))' }}>
            Join thousands of teams already using TrackFlow. Start free, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 animate-pulse-glow">
              Create free account <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login" className="btn-ghost text-base px-8 py-3.5">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg animated-gradient flex items-center justify-center">
              <Clock size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">TrackFlow</span>
          </div>
          <p className="text-xs" style={{ color: 'rgb(var(--text-faint))' }}>© 2026 TrackFlow. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs" style={{ color: 'rgb(var(--text-faint))' }}>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/auth/register" className="hover:text-white transition-colors">Register</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
