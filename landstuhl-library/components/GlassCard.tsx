'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'electric' | 'cyan' | 'gold' | 'aurora' | 'green' | 'red'
  delay?: number
  hover?: boolean
}

const glowMap = {
  electric: 'hover:shadow-glow-electric hover:border-electric/30',
  cyan: 'hover:shadow-glow-cyan hover:border-cyan/30',
  gold: 'hover:shadow-glow-gold hover:border-gold/30',
  aurora: 'hover:shadow-glow-aurora hover:border-aurora/30',
  green: 'hover:shadow-[0_0_40px_rgba(0,255,136,0.35)] hover:border-green-400/30',
  red: 'hover:shadow-[0_0_40px_rgba(255,51,102,0.35)] hover:border-red-400/30',
}

export default function GlassCard({
  children,
  className = '',
  glowColor = 'electric',
  delay = 0,
  hover = true,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.75,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      className={[
        'relative rounded-2xl border border-white/[0.07]',
        'bg-white/[0.04] backdrop-blur-2xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_48px_rgba(0,0,0,0.4)]',
        'transition-all duration-500',
        hover ? glowMap[glowColor] : '',
        className,
      ].join(' ')}
    >
      {/* Top shine line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </motion.div>
  )
}
