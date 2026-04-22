'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Float,
  Stars,
  Sparkles,
  Environment,
  PointMaterial,
  Preload,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

function lastSundayOf(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month + 1, 0))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 7) % 7))
  return d
}

export function isLibraryOpen(): boolean {
  const now = new Date()
  const y = now.getUTCFullYear()
  const offset = now >= lastSundayOf(y, 2) && now < lastSundayOf(y, 9) ? 2 : 1
  const local = new Date(now.getTime() + offset * 3_600_000)
  const day = local.getUTCDay()
  const hm = local.getUTCHours() + local.getUTCMinutes() / 60
  if (day === 0) return false
  if (day >= 1 && day <= 5) return hm >= 10 && hm < 20
  if (day === 6) return hm >= 10 && hm < 17
  return false
}

export function getNextOpenTime(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const offset = now >= lastSundayOf(y, 2) && now < lastSundayOf(y, 9) ? 2 : 1
  const local = new Date(now.getTime() + offset * 3_600_000)
  const day = local.getUTCDay()
  const hm = local.getUTCHours() + local.getUTCMinutes() / 60
  if (day === 0) return 'Opens Monday at 10:00'
  if (day >= 1 && day <= 5 && hm < 10) return 'Opens today at 10:00'
  if (day >= 1 && day <= 4 && hm >= 20) return 'Opens tomorrow at 10:00'
  if (day === 5 && hm >= 20) return 'Opens Saturday at 10:00'
  if (day === 6 && hm < 10) return 'Opens today at 10:00'
  if (day === 6 && hm >= 17) return 'Opens Monday at 10:00'
  return ''
}

function HolographicBook({ mouseX, mouseY, scrollProgress }: { mouseX: number; mouseY: number; scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseX * 0.85, 0.055)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY * 0.28 - 0.08, 0.055)
    groupRef.current.rotation.z = Math.sin(t * 0.28) * 0.028
    const explode = Math.min(scrollProgress * 2.2, 1)
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 1 - explode * 0.97, 0.07))
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, -explode * 6, 0.07)
  })
  return (
    <group ref={groupRef} position={[0.5, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 2.12, 0.3]} />
        <meshStandardMaterial color="#e2d9c8" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 0, 0.172]} castShadow>
        <boxGeometry args={[1.62, 2.24, 0.042]} />
        <meshPhysicalMaterial
          color="#0b1830"
          metalness={1}
          roughness={0.04}
          iridescence={1}
          iridescenceIOR={2.0}
          iridescenceThicknessRange={[100, 800] as [number, number]}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={3}
        />
      </mesh>
      <mesh position={[0, 0, -0.172]} castShadow>
        <boxGeometry args={[1.62, 2.24, 0.042]} />
        <meshPhysicalMaterial color="#09121f" metalness={0.9} roughness={0.18} envMapIntensity={1.8} />
      </mesh>
      <mesh position={[-0.84, 0, 0]} castShadow>
        <boxGeometry args={[0.042, 2.24, 0.38]} />
        <meshStandardMaterial color="#060f1c" metalness={0.85} roughness={0.15} emissive="#3b6fff" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[-0.838, 0, 0]}>
        <boxGeometry args={[0.005, 1.85, 0.38]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3} roughness={0} metalness={1} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.52, 0.195]}>
        <planeGeometry args={[1.15, 0.1]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.5} toneMapped={false} roughness={0} metalness={1} />
      </mesh>
      <mesh position={[0, 0.34, 0.195]}>
        <planeGeometry args={[0.88, 0.055]} />
        <meshStandardMaterial color="#7eb8ff" emissive="#7eb8ff" emissiveIntensity={1.2} toneMapped={false} transparent opacity={0.75} />
      </mesh>
      {[0, 0.09, 0.18].map((off, i) => (
        <mesh key={i} position={[0, -0.72 - off, 0.195]}>
          <planeGeometry args={[0.55 - i * 0.1, 0.022]} />
          <meshStandardMaterial color="#4f6ef7" emissive="#4f6ef7" emissiveIntensity={0.9} toneMapped={false} transparent opacity={0.55 - i * 0.1} />
        </mesh>
      ))}
    </group>
  )
}

interface SwarmItem { pos: THREE.Vector3; rot: THREE.Euler; rs: [number,number,number]; wr: number; ws: number; wo: number }

function BookSwarm({ scrollProgress }: { scrollProgress: number }) {
  const COUNT = 260
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const items = useMemo<SwarmItem[]>(() => Array.from({ length: COUNT }, () => {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 5.5 + Math.random() * 11
    return {
      pos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi) - 2),
      rot: new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
      rs: [(Math.random() - 0.5) * 0.009, (Math.random() - 0.5) * 0.013, (Math.random() - 0.5) * 0.007],
      wr: 0.25 + Math.random() * 0.65, ws: 0.06 + Math.random() * 0.14, wo: Math.random() * Math.PI * 2,
    }
  }), [])
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const d = Math.min(scrollProgress * 2.8, 1)
    items.forEach((item, i) => {
      const wx = Math.sin(t * item.ws + item.wo) * item.wr * (1 - d * 0.4)
      const wy = Math.cos(t * item.ws * 1.3 + item.wo) * item.wr * (1 - d * 0.4)
      dummy.position.set(item.pos.x + wx + item.pos.x * d * 0.5, item.pos.y + wy + item.pos.y * d * 0.35, item.pos.z - d * 9)
      dummy.rotation.set(item.rot.x + t * item.rs[0], item.rot.y + t * item.rs[1], item.rot.z + t * item.rs[2])
      dummy.scale.setScalar(0.055 + Math.sin(item.wo) * 0.02)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[9, 12, 1.8]} />
      <meshStandardMaterial color="#162040" metalness={0.7} roughness={0.3} emissive="#1e3a8a" emissiveIntensity={0.18} />
    </instancedMesh>
  )
}

function FlyingPages({ scrollProgress }: { scrollProgress: number }) {
  const COUNT = 90
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const pages = useMemo(() => Array.from({ length: COUNT }, () => ({
    pos: new THREE.Vector3((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 2),
    vel: new THREE.Vector3((Math.random() - 0.5) * 0.045, (Math.random() - 0.5) * 0.035, (Math.random() - 0.5) * 0.02),
    rot: new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
    rs: new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.07, (Math.random() - 0.5) * 0.04),
    phase: Math.random() * Math.PI * 2, spd: 0.4 + Math.random() * 0.7,
  })), [])
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const burst = Math.pow(Math.min(scrollProgress * 2.6, 1), 1.3)
    pages.forEach((p, i) => {
      const s = burst * 210
      dummy.position.set(
        p.pos.x + p.vel.x * s + Math.sin(t * 0.3 + p.phase) * burst * 1.8,
        p.pos.y + p.vel.y * s + Math.cos(t * 0.22 + p.phase) * burst * 1.4 + t * p.spd * 0.022 * burst,
        p.pos.z + p.vel.z * s - burst * 4.5,
      )
      dummy.rotation.set(p.rot.x + t * p.rs.x * (1 + burst * 5), p.rot.y + t * p.rs.y * (1 + burst * 5), p.rot.z + t * p.rs.z * (1 + burst * 5))
      dummy.scale.setScalar(burst * p.spd * 0.38)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[0.72, 0.95]} />
      <meshStandardMaterial color="#dce8ff" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.68} emissive="#4f6ef7" emissiveIntensity={0.14} />
    </instancedMesh>
  )
}

function Particles() {
  const COUNT = 900
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 34
      arr[i * 3 + 1] = (Math.random() - 0.5) * 26
      arr[i * 3 + 2] = (Math.random() - 0.5) * 22 - 4
    }
    return arr
  }, [])
  const ref = useRef<THREE.Points>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.013
    ref.current.rotation.x = state.clock.elapsedTime * 0.006
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <PointMaterial size={0.02} color="#5b7fff" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function StatusLight({ isOpen }: { isOpen: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const col = isOpen ? '#00ff88' : '#ff3366'
  useFrame((state) => {
    if (!meshRef.current || !lightRef.current) return
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 2.8) * 0.28
    ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 3
    lightRef.current.intensity = pulse * 3.5
  })
  return (
    <group position={[3.4, 2.1, 0.4]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={3} roughness={0} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} color={col} intensity={3.5} distance={5} decay={2} />
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={col} transparent opacity={0.07} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

function CameraRig({ mouseX, mouseY, scrollProgress }: { mouseX: number; mouseY: number; scrollProgress: number }) {
  const { camera } = useThree()
  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * 0.65, 0.05)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouseY * 0.3 + 0.1, 0.05)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5.2 - scrollProgress * 7, 0.055)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function SceneContent({ mouseX, mouseY, scrollProgress, isOpen }: { mouseX: number; mouseY: number; scrollProgress: number; isOpen: boolean }) {
  return (
    <>
      <CameraRig mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
      <Environment preset="city" />
      <fog attach="fog" color="#020817" near={14} far={42} />
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 9, 5]} intensity={0.9} color="#90b4ff" castShadow />
      <directionalLight position={[-4, -5, 2]} intensity={0.35} color="#8b5cf6" />
      <pointLight position={[0, 0, 4]} intensity={1.4} color="#3b6fff" distance={12} decay={2} />
      <Stars radius={80} depth={50} count={2200} factor={3} saturation={0.3} fade speed={0.35} />
      <Sparkles count={55} scale={11} size={1.4} speed={0.18} opacity={0.38} color="#8090ff" />
      <Particles />
      <BookSwarm scrollProgress={scrollProgress} />
      <Float speed={1.15} rotationIntensity={0.07} floatIntensity={0.28}>
        <HolographicBook mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
      </Float>
      <FlyingPages scrollProgress={scrollProgress} />
      <StatusLight isOpen={isOpen} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.18} luminanceSmoothing={0.9} intensity={2.4} mipmapBlur />
        <Vignette offset={0.25} darkness={0.85} />
      </EffectComposer>
      <Preload all />
    </>
  )
}

export default function LibraryScene({ mouseX, mouseY, scrollProgress }: { mouseX: number; mouseY: number; scrollProgress: number }) {
  const isOpen = isLibraryOpen()
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 52, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2, powerPreference: 'high-performance' }}
      shadows
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <SceneContent mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} isOpen={isOpen} />
      </Suspense>
    </Canvas>
  )
}
