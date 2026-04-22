'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { isLibraryOpen, getNextOpenTime } from '@/components/Scene'

const LibraryScene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#020817] flex items-center justify-center z-0">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-blue-500/40 animate-spin" style={{ borderTopColor: '#3b82f6' }} />
        </div>
        <p className="text-white/30 text-xs tracking-[0.3em] uppercase font-mono">Loading 3D Scene</p>
      </div>
    </div>
  ),
})

function useMouse() {
  const [m, setM] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e: MouseEvent) => setM({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: -(e.clientY / window.innerHeight - 0.5) * 2 })
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return m
}

function useScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const h = () => {
      const max = document.body.scrollHeight - window.innerHeight
      setP(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  return p
}

const HOURS = [
  { day: 'Mon – Fri', hours: '10:00 – 20:00', open: true },
  { day: 'Saturday', hours: '10:00 – 17:00', open: true },
  { day: 'Sunday', hours: 'Closed', open: false },
]

const EVENTS = [
  { date: 'APR 28', title: 'Baby Storytime', tag: 'Ages 0–3', accent: '#f59e0b' },
  { date: 'APR 30', title: '3D Printer Workshop', tag: 'Teen Lab', accent: '#06b6d4' },
  { date: 'MAY 02', title: 'Toddler Time', tag: 'Ages 1–5', accent: '#8b5cf6' },
  { date: 'MAY 07', title: 'Adult Book Club', tag: 'Adults', accent: '#3b82f6' },
]

const SERVICES = [
  { icon: '🍼', title: 'Baby Storytime', sub: 'Tue & Thu at 10:00', tag: 'Ages 0–3', desc: 'Songs, rhymes and stories to spark early literacy. Free for all SOFA-eligible families.', accent: '#f59e0b' },
  { icon: '🖨️', title: 'Tech Hub & Makerspace', sub: 'By appointment', tag: 'All ages', desc: '3D printers, laser cutter, recording studio and STEM kits. Book a session, bring an idea.', accent: '#06b6d4' },
  { icon: '🔬', title: 'Research & Digital Resources', sub: '24/7 online access', tag: 'Free with card', desc: 'OverDrive eBooks, Ancestry.com, JSTOR, and 12 databases — accessible worldwide.', accent: '#8b5cf6' },
]

function GlassCard({ children, className = '', accent = '#3b82f6', delay = 0 }: { children: React.ReactNode; className?: string; accent?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, scale: 1.01 }}
      className={`relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-2xl overflow-hidden transition-shadow duration-500 ${className}`}
      style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 20px 50px rgba(0,0,0,0.4)` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 70px rgba(0,0,0,0.5), 0 0 40px ${accent}20` }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.07), 0 20px 50px rgba(0,0,0,0.4)` }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {children}
    </motion.div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <div className="w-5 h-px bg-blue-500/60" />
      <span className="text-xs text-blue-400/80 tracking-[0.28em] uppercase font-mono">{children}</span>
    </div>
  )
}

export default function Home() {
  const mouse = useMouse()
  const scroll = useScrollProgress()
  const isOpen = isLibraryOpen()
  const nextMsg = getNextOpenTime()
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColor = isOpen ? '#00ff88' : '#ff3366'

  return (
    <main className="relative bg-[#020817] text-white">
      {/* ── Fixed 3D Canvas ── */}
      <div className="fixed inset-0 z-0">
        <LibraryScene mouseX={mouse.x} mouseY={mouse.y} scrollProgress={scroll} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020817]/20 via-transparent to-[#020817]/90 pointer-events-none" />
      </div>

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 px-5 md:px-10 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur-2xl"
        >
          <span className="text-amber-400 text-base">📚</span>
          <span className="font-semibold text-sm tracking-[0.06em] text-white/90">
            Landstuhl<span className="text-blue-400">Lib</span>
          </span>
          <div className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-1.5 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
            <span style={{ color: statusColor }}>{isOpen ? 'Open' : 'Closed'}</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl border border-white/[0.07] bg-black/25 backdrop-blur-2xl"
        >
          {['About', 'Events', 'Services', 'Contact'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="px-3.5 py-2 text-sm text-white/50 hover:text-white/90 rounded-lg hover:bg-white/[0.06] transition-all duration-200 tracking-wide">
              {l}
            </a>
          ))}
          <a
            href="#get-card"
            className="ml-1 px-4 py-2 rounded-lg text-sm font-semibold text-amber-400 border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/15 transition-all duration-200 tracking-wide"
          >
            Get a Card
          </a>
        </motion.div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2.5 rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-1.5 w-5">
            <span className={`h-px bg-white/60 transition-all origin-center ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
            <span className={`h-px bg-white/60 transition-all ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`h-px bg-white/60 transition-all origin-center ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
          </div>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-[68px] inset-x-4 z-40 rounded-2xl border border-white/[0.08] bg-[#0a0f1e]/90 backdrop-blur-3xl p-5 flex flex-col gap-2 md:hidden"
          >
            {['About', 'Events', 'Services', 'Contact'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="py-3 px-2 text-white/60 hover:text-white text-sm border-b border-white/[0.05] last:border-0 tracking-wide">
                {l}
              </a>
            ))}
            <a href="#get-card" onClick={() => setMenuOpen(false)} className="mt-1 py-3 px-4 rounded-xl text-center text-sm font-semibold text-amber-400 border border-amber-400/30 bg-amber-400/10">
              Get a Library Card →
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 pt-24 pb-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="inline-flex items-center gap-2.5 mb-8 px-3.5 py-1.5 rounded-full border backdrop-blur-sm bg-white/[0.03]"
            style={{ borderColor: `${statusColor}35` }}
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
            />
            <span className="text-xs font-mono tracking-[0.15em] uppercase" style={{ color: statusColor }}>
              {isOpen ? 'Open Now' : 'Currently Closed'}
            </span>
            {!isOpen && nextMsg && <span className="text-white/30 text-xs">· {nextMsg}</span>}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-bold leading-[0.92] tracking-tight mb-7"
            style={{ fontSize: 'clamp(3.2rem, 8vw, 8.5rem)' }}
          >
            Where
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(135deg, #60a5fa, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Stories
            </span>
            <br />
            Come Alive
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.72 }}
            className="text-white/45 text-lg leading-relaxed max-w-sm mb-10"
          >
            Books, tech & community at Landstuhl Regional Medical Center — free for all SOFA-eligible families.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap gap-3"
          >
            <motion.a
              href="#get-card"
              whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(245,158,11,0.5), 0 0 100px rgba(245,158,11,0.2)' }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,191,36,0.1))',
                border: '1px solid rgba(245,158,11,0.4)',
                color: '#fbbf24',
                boxShadow: '0 0 30px rgba(245,158,11,0.3)',
              }}
            >
              <span className="relative z-10">✦ Get a Library Card</span>
            </motion.a>
            <motion.a
              href="#events"
              whileHover={{ scale: 1.03, borderColor: 'rgba(96,165,250,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 transition-colors border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm"
            >
              Upcoming Events →
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ scaleY: [1, 0.3, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-white/50 to-transparent"
          />
          <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-mono">scroll</span>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          INFO CARDS
      ════════════════════════════════════════ */}
      <section id="about" className="relative z-10 py-12 px-6 md:px-14 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">

          <GlassCard accent="#3b82f6" delay={0.05} className="p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/12 flex items-center justify-center text-lg">🕙</div>
              <div>
                <p className="text-[10px] text-white/35 tracking-[0.22em] uppercase font-mono mb-0.5">Hours</p>
                <h3 className="text-white/90 font-semibold text-sm">Library Hours</h3>
              </div>
            </div>
            <ul className="space-y-2.5">
              {HOURS.map((h) => (
                <li key={h.day} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-white/50 text-sm">{h.day}</span>
                  <span className={`text-sm font-medium font-mono ${h.open ? 'text-blue-400' : 'text-red-400/60'}`}>{h.hours}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard accent="#8b5cf6" delay={0.12} className="p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/12 flex items-center justify-center text-lg">📍</div>
              <div>
                <p className="text-[10px] text-white/35 tracking-[0.22em] uppercase font-mono mb-0.5">Location</p>
                <h3 className="text-white/90 font-semibold text-sm">Find Us</h3>
              </div>
            </div>
            <address className="not-italic text-white/50 text-sm leading-7 mb-4">
              <p className="text-white/80 font-medium mb-1">Landstuhl Regional Medical Center</p>
              <p>Bldg. 3723, Hwy 270</p>
              <p>Landstuhl, Germany 66849</p>
            </address>
            <motion.a
              href="https://maps.google.com/?q=Landstuhl+Regional+Medical+Center"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 4 }}
              className="text-violet-400 text-sm font-medium hover:text-violet-300 transition-colors"
            >
              Get Directions →
            </motion.a>
          </GlassCard>

          <GlassCard accent={statusColor} delay={0.2} className="p-7 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: statusColor, opacity: 0.1 }} />
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${statusColor}15` }}
              >
                {isOpen ? '🟢' : '🔴'}
              </motion.div>
              <div>
                <p className="text-[10px] text-white/35 tracking-[0.22em] uppercase font-mono mb-0.5">Status</p>
                <h3 className="text-white/90 font-semibold text-sm">Right Now</h3>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2 font-mono" style={{ color: statusColor }}>
              {isOpen ? 'Open' : 'Closed'}
            </p>
            <p className="text-white/45 text-sm leading-relaxed mb-4">
              {isOpen ? 'Come on in — we\'re ready to help.' : nextMsg || 'Check back soon.'}
            </p>
            <p className="text-white/25 text-xs font-mono">📞 (314) 529-4655</p>
          </GlassCard>

        </div>
      </section>

      {/* ════════════════════════════════════════
          EVENTS
      ════════════════════════════════════════ */}
      <section id="events" className="relative z-10 py-20 px-6 md:px-14 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-10"
          >
            <Eyebrow>What's On</Eyebrow>
            <h2 className="font-bold leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}>
              Upcoming{' '}
              <span style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Events
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EVENTS.map((ev, i) => (
              <GlassCard key={ev.title} accent={ev.accent} delay={i * 0.07} className="p-6 cursor-pointer group">
                <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider mb-4 font-mono" style={{ background: `${ev.accent}18`, color: ev.accent }}>
                  {ev.date}
                </div>
                <h3 className="text-white/90 font-semibold text-base leading-tight mb-1.5">{ev.title}</h3>
                <p className="text-white/35 text-xs tracking-widest uppercase mb-4">{ev.tag}</p>
                <div className="h-px w-0 group-hover:w-full transition-all duration-500 rounded-full" style={{ background: ev.accent }} />
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SERVICES
      ════════════════════════════════════════ */}
      <section id="services" className="relative z-10 py-20 px-6 md:px-14 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-10"
          >
            <Eyebrow>Programs</Eyebrow>
            <h2 className="font-bold leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}>
              Community{' '}
              <span style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Services
              </span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {SERVICES.map((svc, i) => (
              <GlassCard key={svc.title} accent={svc.accent} delay={i * 0.08} hover={false} className="p-7 md:p-9">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <motion.div
                    whileHover={{ rotate: [-3, 3, -3, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-13 h-13 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: `${svc.accent}15` }}
                  >
                    {svc.icon}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-white/92 font-semibold text-xl">{svc.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider" style={{ background: `${svc.accent}18`, color: svc.accent }}>
                        {svc.tag}
                      </span>
                    </div>
                    <p className="text-white/45 text-sm leading-relaxed max-w-lg">{svc.desc}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm font-medium" style={{ color: svc.accent }}>{svc.sub} →</div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-14 px-6 md:px-14 lg:px-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { n: '40k+', l: 'Items in collection', c: '#60a5fa' },
            { n: '12', l: 'Digital databases', c: '#06b6d4' },
            { n: '3', l: '3D printers', c: '#f59e0b' },
            { n: 'Free', l: 'With a library card', c: '#a78bfa' },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.7 }}
              className="px-8 py-10 flex flex-col gap-2"
              style={{ background: '#020817' }}
            >
              <span className="font-bold font-mono" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', color: s.c }}>{s.n}</span>
              <span className="text-white/40 text-sm">{s.l}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          GET A CARD — hero CTA
      ════════════════════════════════════════ */}
      <section id="get-card" className="relative z-10 py-32 px-6 md:px-14 lg:px-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full blur-[140px] opacity-[0.08]" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)' }} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl text-center relative"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-amber-400/25 bg-amber-400/8 text-amber-400 text-xs tracking-[0.22em] uppercase font-mono">
            ✦ It&apos;s Completely Free ✦
          </div>
          <h2 className="font-bold leading-[0.9] tracking-tight mb-6" style={{ fontSize: 'clamp(3rem, 7vw, 7rem)' }}>
            Get Your{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Card
            </span>
            {' '}Today
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Any SOFA-eligible patron gets a library card for free. Bring your military ID to the circulation desk — takes under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="#about"
              whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(245,158,11,0.6), 0 0 120px rgba(245,158,11,0.25)' }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl text-base font-bold tracking-[0.08em] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(251,146,60,0.15))',
                border: '1px solid rgba(245,158,11,0.45)',
                color: '#fbbf24',
                boxShadow: '0 0 40px rgba(245,158,11,0.35)',
              }}
            >
              <span>✦</span> Get a Library Card
            </motion.a>
            <motion.a
              href="tel:3145294655"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 px-8 py-5 rounded-xl text-base font-medium text-white/60 hover:text-white/90 border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm transition-colors"
            >
              📞 Call the Library
            </motion.a>
          </div>
          <p className="text-white/20 text-xs mt-8 font-mono">DSN: 486-4655 · COMM: (314) 529-4655</p>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer id="contact" className="relative z-10 border-t border-white/[0.05] py-14 px-6 md:px-14 lg:px-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber-400">📚</span>
              <span className="font-bold text-white/80 tracking-wider text-sm">LANDSTUHL LIBRARY</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs">
              Serving the military community in Landstuhl, Germany since 1952.
            </p>
          </div>
          <div>
            <h4 className="text-white/40 text-xs tracking-[0.22em] uppercase font-mono mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Catalog', 'Digital Resources', 'Programs', 'Tech Hub', 'Contact'].map((l) => (
                <li key={l}><a href="#" className="text-white/35 hover:text-white/70 text-sm transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white/40 text-xs tracking-[0.22em] uppercase font-mono mb-4">Contact</h4>
            <address className="not-italic text-white/35 text-sm leading-loose">
              <p>Bldg. 3723, Hwy 270</p>
              <p>Landstuhl, Germany 66849</p>
              <p className="mt-2"><a href="tel:3145294655" className="hover:text-white/60 transition-colors">(314) 529-4655</a></p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/[0.04] pt-7 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/20 text-xs font-mono">© 2025 Landstuhl Library · US Army MWR</p>
          <p className="text-white/15 text-xs font-mono">Built with Next.js · Three.js · Framer Motion</p>
        </div>
      </footer>

      {/* Spacer to allow scroll depth for 3D camera movement */}
      <div className="h-[60vh]" />
    </main>
  )
}
