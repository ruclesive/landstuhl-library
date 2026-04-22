'use client'

import { useState, useEffect } from 'react'

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handle = () => {
      const scrolled = window.scrollY
      const max = document.body.scrollHeight - window.innerHeight
      setProgress(max > 0 ? scrolled / max : 0)
    }
    window.addEventListener('scroll', handle, { passive: true })
    handle()
    return () => window.removeEventListener('scroll', handle)
  }, [])

  return progress
}

export function useMouse(): { x: number; y: number } {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      })
    }
    window.addEventListener('mousemove', handle, { passive: true })
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  return mouse
}
