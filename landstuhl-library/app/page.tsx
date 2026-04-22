'use client'

import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import GlassCard from '@/components/GlassCard'
import { useScrollProgress, useMouse } from '@/hooks/useScrollProgress'
import { isLibraryOpen, getNextOpenTime } from '@/components/Scene'

// Lazy-load the heavy 3D canvas
const LibraryScene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-void flex items-center justify-center z-0">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-electric/40 border-t-electric animate-spin" />
        <p className="text-white/40 text-sm tracking-[0.2em] uppercase">Loading</p>
      </div>
    </div>
  ),
})

// ─── Section Fade-in wrapper ─────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Gradient headline helper ────────────────────────────────────────────────
function GradientText({
  children,
  from = '#4f6ef7',
  to = '#06d6d6',
  className = '',
}: {
  children: React.ReactNode
  from?: string
  to?: string
  className?: string
}) {
  return (
    <span
      className={className}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  )
}

// ─── Neon CTA Button ─────────────────────────────────────────────────────────
function NeonButton({
  children,
  href,
  color = 'electric',
  large = false,
}: {
  children: React.ReactNode
  href?: string
  color?: 'electric' | 'cyan' | 'gold'
  large?: boolean
}) {
  const colorMap = {
    electric: {
      bg: 'from-electric/20 to-aurora/20',
      border: 'border-electric/40',
      glow: '0 0 40px rgba(79,110,247,0.5), 0 0 80px rgba(79,110,247,0.2)',
      glowHover: '0 0 60px rgba(79,110,247,0.7), 0 0 120px rgba(79,110,247,0.3)',
      text: 'text-electric',
    },
    cyan: {
      bg: 'from-cyan/20 to-electric/20',
      border: 'border-cyan/40',
      glow: '0 0 40px rgba(6,214,214,0.5)',
      glowHover: '0 0 60px rgba(6,214,214,0.7)',
      text: 'text-cyan',
    },
    gold: {
      bg: 'from-gold/25 to-amber-400/20',
      border: 'border-gold/50',
      glow: '0 0 40px rgba(247,201,72,0.5)',
      glowHover: '0 0 60px rgba(247,201,72,0.7)',
      text: 'text-gold',
    },
  }

  const c = colorMap[color]
  const Tag = href ? motion.a : motion.button

  return (
    <Tag
      href={href}
      initial={{ boxShadow: c.glow }}
      whileHover={{ boxShadow: c.glowHover, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className={[
        `relative inline-flex items-center justify-center gap-2 rounded-xl`,
        `bg-gradient-to-r ${c.bg}`,
        `border ${c.border}`,
        `backdrop-blur-md font-semibold tracking-[0.12em] uppercase`,
        `transition-colors duration-300`,
        c.text,
        large
          ? 'px-10 py-5 text-base min-w-[240px]'
          : 'px-7 py-3.5 text-sm min-w-[180px]',
      ].join(' ')}
    >
      {/* Shine sweep */}
      <span className="absolute inset-0 rounded-xl overflow-hidden">
        <motion.span
          className="absolute top-0 -left-full w-[60%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ left: ['−100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        />
      </span>
      {children}
    </Tag>
  )
}

// ─── Hours card data ─────────────────────────────────────────────────────────
const HOURS = [
  { day: 'Monday – Friday', hours: '10:00 – 20:00' },
  { day: 'Saturday', hours: '10:00 – 17:00' },
  { day: 'Sunday', hours: 'Closed' },
]

// ─── Events ──────────────────────────────────────────────────────────────────
const EVENTS = [
  { date: 'APR 28', title: 'Baby Storytime', tag: 'Ages 0–3', color: '#f7c948' },
  { date: 'APR 30', title: '3D Printer Workshop', tag: 'Teen Lab', color: '#06d6d6' },
  { date: 'MAY 02', title: 'Toddler Time', tag: 'Ages 1–5', color: '#9b5de5' },
  { date: 'MAY 07', title: 'Book Club Meeting', tag: 'Adults', color: '#4f6ef7' },
]

// ─── Home Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const scrollProgress = useScrollProgress()
  const mouse = useMouse()
  const [storypageHovered, setStorypageHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isOpen = isLibraryOpen()
  const nextOpenMsg = getNextOpenTime()

  const heroRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const storyInView = useInView(storyRef, { margin: '-100px' })

  // Sync storytime hover with 3D scene
  const handleStoryEnter = () => setStorypageHovered(true)
  const handleStoryLeave = () => setStorypageHovered(false)

  return (
    <main className="relative min-h-[500vh] bg-void text-white">
      {/* ── 3D Canvas — fixed background ── */}
      <div className="fixed inset-0 z-0">
        <LibraryScene
          mouseX={mouse.x}
          mouseY={mouse.y}
          scrollProgress={scrollProgress}
          storypageHovered={storypageHovered || storyInView}
        />
        {/* Dark gradient overlay so text is always legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/30 via-void/0 to-void/80 pointer-events-none" />
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-5">
        <div
          className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.07] rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-glass cursor-pointer"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <span className="text-gold text-lg">📚</span>
          <span className="font-semibold text-sm tracking-[0.08em] text-white/90">
            LANDSTUHL<span className="text-electric/80">LIB</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 backdrop-blur-2xl bg-white/[0.04] border border-white/[0.07] rounded-2xl px-3 py-2 shadow-glass">
          {['About', 'Services', 'Events', 'Get Card'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors duration-200 rounded-xl hover:bg-white/[0.06] tracking-wide"
            >
              {item}
            </a>
          ))}
          <NeonButton color="gold">Library Card</NeonButton>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden backdrop-blur-2xl bg-white/[0.04] border border-white/[0.07] rounded-xl p-3"
        >
          <div className="flex flex-col gap-1.5 w-5">
            <span className={`h-px bg-white/70 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`h-px bg-white/70 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`h-px bg-white/70 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 inset-x-4 z-40 backdrop-blur-3xl bg-deep/80 border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-3 shadow-glass md:hidden"
          >
            {['About', 'Services', 'Events', 'Get Card'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                onClick={() => setMenuOpen(false)}
                className="text-white/70 hover:text-white py-3 border-b border-white/[0.05] text-sm tracking-wider uppercase last:border-0"
              >
                {item}
              </a>
            ))}
            <NeonButton color="gold" large>Get Library Card</NeonButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24"
        style={{ paddingTop: '80px' }}
      >
        <div className="max-w-3xl">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border backdrop-blur-md bg-white/[0.04]"
            style={{
              borderColor: isOpen ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)',
              boxShadow: isOpen
                ? '0 0 20px rgba(0,255,136,0.15)'
                : '0 0 20px rgba(255,51,102,0.15)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse-glow"
              style={{ background: isOpen ? '#00ff88' : '#ff3366' }}
            />
            <span
              className="text-xs font-semibold tracking-[0.15em] uppercase"
              style={{ color: isOpen ? '#00ff88' : '#ff3366' }}
            >
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
            {!isOpen && nextOpenMsg && (
              <span className="text-white/40 text-xs">· {nextOpenMsg}</span>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-6"
          >
            Your
            <br />
            <GradientText from="#4f6ef7" to="#9b5de5">
              Community
            </GradientText>
            <br />
            <GradientText from="#06d6d6" to="#4f6ef7">
              Library
            </GradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
            className="text-lg text-white/55 max-w-md leading-relaxed mb-10 font-light"
          >
            Books, tech, community & wonder — on Landstuhl Regional
            Medical Center, Germany. Free for all SOFA-eligible families.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.72 }}
            className="flex flex-wrap gap-4"
          >
            <NeonButton large color="gold" href="#get-card">
              <span>✦</span> Get a Library Card
            </NeonButton>
            <NeonButton color="cyan" href="#events">
              View Events →
            </NeonButton>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent"
          />
          <span className="text-white/25 text-xs tracking-[0.25em] uppercase">scroll</span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          INFO CARDS — Hours · Location · Status
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 px-6 md:px-16 lg:px-24" id="about">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">

          {/* Hours card */}
          <GlassCard glowColor="electric" delay={0.1} className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-9 h-9 rounded-xl bg-electric/15 flex items-center justify-center text-lg">🕙</span>
              <div>
                <p className="text-xs text-white/40 tracking-[0.18em] uppercase mb-0.5">Hours</p>
                <h3 className="text-white font-semibold">Library Hours</h3>
              </div>
            </div>
            <ul className="space-y-3">
              {HOURS.map((h) => (
                <li key={h.day} className="flex justify-between items-center py-2 border-b border-white/[0.05] last:border-0">
                  <span className="text-white/60 text-sm">{h.day}</span>
                  <span className={`text-sm font-medium ${h.hours === 'Closed' ? 'text-red-400/70' : 'text-electric'}`}>
                    {h.hours}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Location card */}
          <GlassCard glowColor="aurora" delay={0.2} className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-9 h-9 rounded-xl bg-aurora/15 flex items-center justify-center text-lg">📍</span>
              <div>
                <p className="text-xs text-white/40 tracking-[0.18em] uppercase mb-0.5">Location</p>
                <h3 className="text-white font-semibold">Find Us</h3>
              </div>
            </div>
            <address className="not-italic space-y-2 text-white/60 text-sm leading-relaxed">
              <p className="text-white/80 font-medium">Landstuhl Regional Medical Center</p>
              <p>Bldg. 3723, Hwy 270</p>
              <p>Landstuhl, Germany 66849</p>
            </address>
            <motion.a
              href="https://maps.google.com/?q=Landstuhl+Regional+Medical+Center"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-aurora text-sm font-medium hover:text-aurora/80 transition-colors"
              whileHover={{ x: 3 }}
            >
              Get Directions →
            </motion.a>
          </GlassCard>

          {/* Status card */}
          <GlassCard
            glowColor={isOpen ? 'cyan' : 'red' as any}
            delay={0.3}
            className="p-8 relative overflow-hidden"
          >
            {/* Glow orb bg */}
            <div
              className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: isOpen ? '#00ff88' : '#ff3366' }}
            />
            <div className="flex items-center gap-3 mb-6">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: isOpen ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)' }}
              >
                {isOpen ? '🟢' : '🔴'}
              </motion.span>
              <div>
                <p className="text-xs text-white/40 tracking-[0.18em] uppercase mb-0.5">Status</p>
                <h3 className="text-white font-semibold">Right Now</h3>
              </div>
            </div>
            <p
              className="text-3xl font-bold mb-2"
              style={{ color: isOpen ? '#00ff88' : '#ff3366' }}
            >
              {isOpen ? 'Open' : 'Closed'}
            </p>
            <p className="text-white/50 text-sm leading-relaxed">
              {isOpen
                ? 'Come on in! We're open and ready to help.'
                : nextOpenMsg || 'Check back soon.'}
            </p>
            <p className="text-white/30 text-xs mt-4">
              📞 (314) 529-4655
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          EVENTS SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 px-6 md:px-16 lg:px-24" id="events">
        <Reveal className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs text-electric/70 tracking-[0.25em] uppercase mb-2">What's On</p>
              <h2 className="text-4xl md:text-5xl font-bold">
                Upcoming{' '}
                <GradientText from="#4f6ef7" to="#06d6d6">Events</GradientText>
              </h2>
            </div>
            <motion.a
              href="#"
              whileHover={{ x: 4 }}
              className="text-white/40 hover:text-white text-sm tracking-wider transition-colors hidden md:block"
            >
              View all →
            </motion.a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EVENTS.map((ev, i) => (
              <GlassCard key={ev.title} delay={i * 0.08} className="p-6 cursor-pointer group">
                <div
                  className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider mb-4"
                  style={{ background: `${ev.color}18`, color: ev.color }}
                >
                  {ev.date}
                </div>
                <h3 className="text-white font-semibold text-lg leading-tight mb-2 group-hover:text-white/90 transition-colors">
                  {ev.title}
                </h3>
                <p className="text-white/40 text-xs tracking-widest uppercase">{ev.tag}</p>
                <div
                  className="mt-4 h-px w-0 group-hover:w-full transition-all duration-500 rounded-full"
                  style={{ background: ev.color }}
                />
              </GlassCard>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SERVICES — Storytime / Tech / Research
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6 md:px-16 lg:px-24" id="services">
        <Reveal className="max-w-6xl mx-auto">
          <p className="text-xs text-aurora/70 tracking-[0.25em] uppercase mb-3">What We Offer</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            Community{' '}
            <GradientText from="#9b5de5" to="#4f6ef7">Programs</GradientText>
          </h2>

          <div className="space-y-4">
            {/* ── Baby Storytime ── */}
            <div
              ref={storyRef}
              onMouseEnter={handleStoryEnter}
              onMouseLeave={handleStoryLeave}
              className="group"
            >
              <GlassCard
                glowColor="gold"
                delay={0}
                hover={false}
                className="p-8 md:p-10 cursor-pointer overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
                    transition={{ duration: 0.5 }}
                    className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center text-3xl flex-shrink-0"
                  >
                    🍼
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">Baby Storytime</h3>
                      <span className="px-2.5 py-1 bg-gold/15 text-gold text-xs rounded-full tracking-wider">AGES 0–3</span>
                    </div>
                    <p className="text-white/55 leading-relaxed max-w-xl">
                      Songs, rhymes, and stories designed to spark early literacy. Every week, free
                      and open to all SOFA-eligible families on post.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gold text-sm font-medium">
                    <span>Tues & Thurs 10:00</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </div>
                </div>
                {/* Hover hint */}
                <p className="text-white/20 text-xs mt-4 md:hidden">
                  Hover to see the magic ✨
                </p>
                <AnimatePresence>
                  {(storypageHovered || storyInView) && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-gold/60 text-xs mt-3 tracking-widest uppercase overflow-hidden"
                    >
                      ✦ Watch the 3D bubbles above ✦
                    </motion.p>
                  )}
                </AnimatePresence>
              </GlassCard>
            </div>

            {/* ── Tech Hub ── */}
            <GlassCard glowColor="cyan" delay={0.1} className="p-8 md:p-10 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan/15 flex items-center justify-center text-3xl flex-shrink-0">
                  🖨️
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">Tech Hub</h3>
                    <span className="px-2.5 py-1 bg-cyan/15 text-cyan text-xs rounded-full tracking-wider">MAKERSPACE</span>
                  </div>
                  <p className="text-white/55 leading-relaxed max-w-xl">
                    3D printers, laser cutters, recording studio, and STEM kits. Book a session,
                    bring an idea, leave with something you made.
                  </p>
                </div>
                <div className="text-cyan text-sm font-medium">By appointment →</div>
              </div>
            </GlassCard>

            {/* ── Research ── */}
            <GlassCard glowColor="aurora" delay={0.2} className="p-8 md:p-10 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-aurora/15 flex items-center justify-center text-3xl flex-shrink-0">
                  🔬
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">Research & Digital</h3>
                    <span className="px-2.5 py-1 bg-aurora/15 text-aurora text-xs rounded-full tracking-wider">24/7 ACCESS</span>
                  </div>
                  <p className="text-white/55 leading-relaxed max-w-xl">
                    OverDrive eBooks, Ancestry.com military records, JSTOR, and database access —
                    all free with your card, accessible anywhere in the world.
                  </p>
                </div>
                <div className="text-aurora text-sm font-medium">Browse catalog →</div>
              </div>
            </GlassCard>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 px-6 md:px-16 lg:px-24">
        <Reveal>
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.07]">
            {[
              { num: '40,000+', label: 'Items in Collection', color: '#4f6ef7' },
              { num: '12', label: 'Digital Databases', color: '#06d6d6' },
              { num: '3', label: '3D Printers', color: '#f7c948' },
              { num: 'Free', label: 'With a Library Card', color: '#9b5de5' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.7 }}
                className="bg-void/60 backdrop-blur-sm px-8 py-10 flex flex-col gap-2"
              >
                <span className="text-3xl md:text-4xl font-bold" style={{ color: s.color }}>
                  {s.num}
                </span>
                <span className="text-white/45 text-sm">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GET A LIBRARY CARD — Hero CTA
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="get-card"
        className="relative z-10 py-32 px-6 md:px-16 lg:px-24 flex items-center justify-center"
      >
        {/* Glow blob */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full blur-[120px] opacity-15 bg-gradient-to-br from-electric via-aurora to-cyan" />
        </div>

        <Reveal className="max-w-3xl text-center relative">
          <div className="inline-block px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs tracking-[0.2em] uppercase mb-6">
            ✦ It's Free ✦
          </div>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Get Your{' '}
            <GradientText from="#f7c948" to="#f77c06">
              Card Today
            </GradientText>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Any SOFA-eligible patron can get a library card for free. Bring your
            military ID to the circulation desk — it takes under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <NeonButton large color="gold" href="#about">
              <span className="text-lg">✦</span>
              Get a Library Card
            </NeonButton>
            <NeonButton color="electric" href="tel:3145294655">
              📞 Call the Library
            </NeonButton>
          </div>
          <p className="text-white/25 text-xs mt-8 tracking-wider">
            DSN: 486-4655 · COMM: (314) 529-4655
          </p>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.06] py-14 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gold text-xl">📚</span>
              <span className="font-bold tracking-wider text-white/80">LANDSTUHL LIBRARY</span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed max-w-xs">
              Serving the military community in Landstuhl, Germany since 1952.
            </p>
          </div>
          <div>
            <h4 className="text-white/60 text-xs tracking-[0.2em] uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Catalog', 'Digital Resources', 'Programs', 'Tech Hub', 'Contact'].map((l) => (
                <li key={l}>
                  <a href="#" className="text-white/40 hover:text-white/80 text-sm transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white/60 text-xs tracking-[0.2em] uppercase mb-4">Contact</h4>
            <address className="not-italic text-white/40 text-sm leading-loose">
              <p>Bldg. 3723, Hwy 270</p>
              <p>Landstuhl, Germany 66849</p>
              <p className="mt-2">
                <a href="tel:3145294655" className="hover:text-white/70 transition-colors">
                  (314) 529-4655
                </a>
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/25 text-xs">© 2025 Landstuhl Regional Medical Center Library. Part of the US Army MWR.</p>
          <p className="text-white/20 text-xs">Built with Next.js · Three.js · Framer Motion</p>
        </div>
      </footer>
    </main>
  )
}
