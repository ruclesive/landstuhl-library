'use client'

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  Suspense,
  forwardRef,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Float,
  Stars,
  Sparkles,
  MeshDistortMaterial,
  GradientTexture,
  Preload,
  useDetectGPU,
  Trail,
  PointMaterial,
  Points,
} from '@react-three/drei'
import * as THREE from 'three'

// ─── Library Hours (Landstuhl / Ramstein, Germany — CET/CEST) ──────────────
function getLandstuhlTime(): Date {
  const now = new Date()
  // Determine if Germany is in DST (last Sunday in March → last Sunday in October)
  const year = now.getUTCFullYear()
  const dstStart = lastSundayOf(year, 2) // March (0-indexed)
  const dstEnd = lastSundayOf(year, 9) // October
  const offset = now >= dstStart && now < dstEnd ? 2 : 1
  return new Date(now.getTime() + offset * 3_600_000)
}

function lastSundayOf(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month + 1, 0)) // last day of month
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 7) % 7))
  return d
}

export function isLibraryOpen(): boolean {
  const local = getLandstuhlTime()
  const day = local.getUTCDay() // 0=Sun … 6=Sat
  const hm = local.getUTCHours() + local.getUTCMinutes() / 60
  if (day === 0) return false
  if (day >= 1 && day <= 5) return hm >= 10 && hm < 20 // Mon–Fri 10-20
  if (day === 6) return hm >= 10 && hm < 17              // Sat 10-17
  return false
}

export function getNextOpenTime(): string {
  const local = getLandstuhlTime()
  const day = local.getUTCDay()
  const hm = local.getUTCHours() + local.getUTCMinutes() / 60

  if (day === 0) return 'Opens Monday at 10:00'
  if (day >= 1 && day <= 5) {
    if (hm < 10) return 'Opens today at 10:00'
    if (hm >= 20) return 'Opens tomorrow at 10:00'
  }
  if (day === 6) {
    if (hm < 10) return 'Opens today at 10:00'
    if (hm >= 17) return 'Opens Monday at 10:00'
  }
  return ''
}

// ─── Book Component ─────────────────────────────────────────────────────────
function Book3D({
  mouseX,
  mouseY,
  scrollProgress,
}: {
  mouseX: number
  mouseY: number
  scrollProgress: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const coverMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Mouse parallax tilt
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mouseX * 0.6,
      0.06,
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      mouseY * 0.25 - 0.1,
      0.06,
    )

    // Gentle idle sway on top of mouse
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      Math.sin(t * 0.4) * 0.04,
      0.05,
    )

    // Scroll-driven "explosion" — book scales down and drifts back
    const explode = Math.min(scrollProgress * 2, 1)
    const scale = THREE.MathUtils.lerp(1, 0.0, explode)
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, scale, 0.08),
    )
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      explode * -4,
      0.08,
    )

    // Hover pulse
    if (coverMatRef.current) {
      coverMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        coverMatRef.current.emissiveIntensity,
        hovered ? 0.4 : 0.08,
        0.08,
      )
    }
  })

  return (
    <group ref={groupRef} position={[0.4, 0, 0]}>
      {/* ── Pages block ── */}
      <mesh castShadow>
        <boxGeometry args={[1.55, 2.18, 0.3]} />
        <meshStandardMaterial
          color="#e8e0d0"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* ── Front cover ── */}
      <mesh
        position={[0, 0, 0.175]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[1.65, 2.28, 0.04]} />
        <meshStandardMaterial
          ref={coverMatRef}
          color="#1a2744"
          roughness={0.25}
          metalness={0.55}
          emissive="#4f6ef7"
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* ── Back cover ── */}
      <mesh position={[0, 0, -0.175]} castShadow>
        <boxGeometry args={[1.65, 2.28, 0.04]} />
        <meshStandardMaterial color="#141d36" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* ── Spine ── */}
      <mesh position={[-0.845, 0, 0]} castShadow>
        <boxGeometry args={[0.045, 2.28, 0.38]} />
        <meshStandardMaterial
          color="#0d1628"
          roughness={0.2}
          metalness={0.7}
          emissive="#4f6ef7"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* ── Gold spine stripe ── */}
      <mesh position={[-0.841, 0, 0]}>
        <boxGeometry args={[0.008, 2.28, 0.38]} />
        <meshStandardMaterial
          color="#f7c948"
          roughness={0.1}
          metalness={0.9}
          emissive="#f7c948"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* ── Cover title emboss glow ── */}
      <mesh position={[0, 0.3, 0.198]}>
        <planeGeometry args={[1.1, 0.15]} />
        <meshStandardMaterial
          color="#f7c948"
          emissive="#f7c948"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={1}
          transparent
          opacity={hovered ? 0.9 : 0.55}
        />
      </mesh>
      <mesh position={[0, 0.08, 0.198]}>
        <planeGeometry args={[0.8, 0.08]} />
        <meshStandardMaterial
          color="#94b0ff"
          emissive="#94b0ff"
          emissiveIntensity={0.4}
          transparent
          opacity={hovered ? 0.7 : 0.3}
        />
      </mesh>
    </group>
  )
}

// ─── Flying Pages Particle System ───────────────────────────────────────────
interface PageData {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  rotSpeed: THREE.Vector3
  phase: number
  speed: number
}

function FlyingPages({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const pages = useMemo<PageData[]>(
    () =>
      Array.from({ length: 120 }, () => ({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.01,
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.02,
        ),
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
      })),
    [],
  )

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const burst = Math.pow(Math.min(scrollProgress * 2.5, 1), 1.4)

    pages.forEach((page, i) => {
      const bob = Math.sin(t * page.speed + page.phase) * 0.18
      const drift = t * page.speed * 0.08

      const x = page.position.x + page.velocity.x * burst * 180 + Math.sin(t * 0.2 + page.phase) * burst * 2
      const y = page.position.y + page.velocity.y * burst * 180 + bob + drift
      const z = page.position.z + page.velocity.z * burst * 120 - burst * scrollProgress * 3

      dummy.position.set(x, y, z)
      dummy.rotation.set(
        page.rotation.x + t * page.rotSpeed.x * (1 + burst * 3),
        page.rotation.y + t * page.rotSpeed.y * (1 + burst * 3),
        page.rotation.z + t * page.rotSpeed.z * (1 + burst * 3),
      )

      const scaleBase = 0.08 + burst * 0.22
      dummy.scale.setScalar(scaleBase * page.speed)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 120]} castShadow>
      <planeGeometry args={[0.7, 0.92]} />
      <meshStandardMaterial
        color="#cdd8ff"
        roughness={0.9}
        metalness={0.0}
        side={THREE.DoubleSide}
        transparent
        opacity={0.72}
        emissive="#4f6ef7"
        emissiveIntensity={0.06}
      />
    </instancedMesh>
  )
}

// ─── Floating Community Orbs (Storytime / Tech / Research) ──────────────────
function CommunityOrbs({ scrollProgress }: { scrollProgress: number }) {
  const orbs = useMemo(
    () => [
      { label: 'Storytime', color: '#f7c948', pos: [-3.5, 1.2, -2] as [number, number, number], phase: 0 },
      { label: 'Tech Hub', color: '#06d6d6', pos: [0, -1.8, -3] as [number, number, number], phase: 2.1 },
      { label: 'Research', color: '#9b5de5', pos: [3.8, 0.6, -1.5] as [number, number, number], phase: 4.2 },
    ],
    [],
  )

  return (
    <>
      {orbs.map((orb, i) => (
        <OrbItem key={orb.label} {...orb} index={i} scrollProgress={scrollProgress} />
      ))}
    </>
  )
}

function OrbItem({
  color,
  pos,
  phase,
  index,
  scrollProgress,
}: {
  label: string
  color: string
  pos: [number, number, number]
  phase: number
  index: number
  scrollProgress: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const reveal = Math.max(0, Math.min((scrollProgress * 3 - index * 0.2), 1))

    ref.current.position.x = pos[0] + Math.sin(t * 0.4 + phase) * 0.3
    ref.current.position.y = pos[1] + Math.cos(t * 0.35 + phase) * 0.25
    ref.current.position.z = pos[2]
    ref.current.scale.setScalar(
      THREE.MathUtils.lerp(ref.current.scale.x, reveal * 0.55, 0.05),
    )

    if (lightRef.current) {
      lightRef.current.intensity = reveal * 1.8
    }
  })

  const col = new THREE.Color(color)

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.1}
        metalness={0.6}
        distort={0.35}
        speed={2}
        transparent
        opacity={0.7}
      />
      <pointLight
        ref={lightRef}
        color={color}
        intensity={0}
        distance={6}
        decay={2}
      />
    </mesh>
  )
}

// ─── Baby Storytime Bubbles ──────────────────────────────────────────────────
function StoryBubbles({ active }: { active: boolean }) {
  const count = 30
  const refs = useRef<THREE.Mesh[]>([])

  const bubbleData = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 6,
        y: -2 + Math.random() * 2,
        z: (Math.random() - 0.5) * 3,
        speed: 0.3 + Math.random() * 0.5,
        radius: 0.06 + Math.random() * 0.14,
        phase: (i / count) * Math.PI * 2,
      })),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      const d = bubbleData[i]
      const rise = active ? d.speed * 0.04 : 0
      mesh.position.y = ((d.y + t * rise * 60) % 7) - 3
      mesh.position.x = d.x + Math.sin(t * d.speed + d.phase) * 0.3
      mesh.scale.setScalar(
        THREE.MathUtils.lerp(mesh.scale.x, active ? 1 : 0, 0.07),
      )
    })
  })

  return (
    <>
      {bubbleData.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) refs.current[i] = el }}
          position={[b.x, b.y, b.z]}
          scale={0}
        >
          <sphereGeometry args={[b.radius, 12, 12]} />
          <meshStandardMaterial
            color="#c8f0ff"
            roughness={0}
            metalness={0.1}
            transparent
            opacity={0.45}
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </>
  )
}

// ─── Neon Status Light ───────────────────────────────────────────────────────
function NeonStatusLight({ isOpen }: { isOpen: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const color = isOpen ? '#00ff88' : '#ff3366'

  useFrame((state) => {
    if (!meshRef.current || !lightRef.current) return
    const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 3) * 0.3
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.emissiveIntensity = pulse * (isOpen ? 1.4 : 1.0)
    }
    lightRef.current.intensity = pulse * (isOpen ? 2.5 : 1.8)
  })

  return (
    <group position={[3.8, 2.6, 0.5]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={2.5}
        distance={5}
        decay={2}
      />
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

// ─── Ambient Particle Field ──────────────────────────────────────────────────
function AmbientParticles() {
  const count = 800
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 28
      arr[i * 3 + 1] = (Math.random() - 0.5) * 22
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4
    }
    return arr
  }, [])

  const ref = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.018
    ref.current.rotation.x = state.clock.elapsedTime * 0.009
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.028}
        color="#4f6ef7"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── Camera Rig ──────────────────────────────────────────────────────────────
function CameraRig({
  mouseX,
  mouseY,
  scrollProgress,
}: {
  mouseX: number
  mouseY: number
  scrollProgress: number
}) {
  const { camera } = useThree()

  useFrame(() => {
    // Subtle mouse parallax on camera
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * 0.8, 0.04)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -mouseY * 0.5 + 0.2, 0.04)

    // Scroll-driven camera dolly through the "book stack"
    const targetZ = 5 - scrollProgress * 8
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06)

    // Slight upward camera drift on scroll (cinematic)
    const targetY = camera.position.y - scrollProgress * 1.5
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.04)

    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─── Main Scene ──────────────────────────────────────────────────────────────
function SceneContent({
  mouseX,
  mouseY,
  scrollProgress,
  storypageHovered,
  isOpen,
}: {
  mouseX: number
  mouseY: number
  scrollProgress: number
  storypageHovered: boolean
  isOpen: boolean
}) {
  return (
    <>
      <CameraRig mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} color="#b0c4ff" castShadow />
      <directionalLight position={[-4, -3, 2]} intensity={0.2} color="#9b5de5" />
      <pointLight position={[0, 0, 4]} intensity={0.8} color="#4f6ef7" distance={12} decay={2} />

      <Stars radius={60} depth={30} count={1200} factor={3} saturation={0.4} fade speed={0.6} />
      <Sparkles count={80} scale={12} size={1.8} speed={0.25} opacity={0.5} color="#94b0ff" />

      <AmbientParticles />

      <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.35}>
        <Book3D mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
      </Float>

      <FlyingPages scrollProgress={scrollProgress} />
      <CommunityOrbs scrollProgress={scrollProgress} />
      <StoryBubbles active={storypageHovered} />
      <NeonStatusLight isOpen={isOpen} />
    </>
  )
}

// ─── Exported Canvas Wrapper ─────────────────────────────────────────────────
export default function LibraryScene({
  mouseX,
  mouseY,
  scrollProgress,
  storypageHovered,
}: {
  mouseX: number
  mouseY: number
  scrollProgress: number
  storypageHovered: boolean
}) {
  const isOpen = useMemo(() => isLibraryOpen(), [])

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 55, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      shadows
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <SceneContent
          mouseX={mouseX}
          mouseY={mouseY}
          scrollProgress={scrollProgress}
          storypageHovered={storypageHovered}
          isOpen={isOpen}
        />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}
