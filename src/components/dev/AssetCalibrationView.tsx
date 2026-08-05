/**
 * src/components/dev/AssetCalibrationView.tsx
 *
 * §十 · 开发专用校准视图。
 *
 * Display rules（§十）：
 *  - 仅在 import.meta.env.DEV === true 且 location.search 包含 ?assetCalibration=1 时显示
 *  - 生产构建中本组件会被 Scene3D 的条件判断短路（永远不渲染）。
 *
 * Contents：
 *  - 5 Living 模型并排（spacing 3m）；
 *  - 每个模型独立地面网格（10×10，1m divisions）
 *  - 1m reference cube（白色线框 + 实体）；
 *  - 每模型头顶 HUD：name / raw AABB / uniformScale / effective AABB / pivot / PASS|WARN|FAIL（按 §七 compareAabb tolerance 0.01 PASS, 0.03 WARN）
 *  - 视角切换: front / 45° / side / top
 *  - 灯光切换: neutral daylight / warm evening / nostalgic night
 *
 * Performance (§十)：
 *  - Max 2 real-time point lights；其余 ambient / directional；
 *  - 无 postprocessing / 无体积光 / 阴影可关闭。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import {
  WP0A_LIVING_ASSET_IDS,
  getModelAsset,
  type ModelAssetId,
} from '../../data/assets/modelRegistry'
import { RegisteredModel } from '../arena3d/RegisteredModel'
import { compareAabb, measureObjectAabb, type Vec3 } from '../../game/modelCalibration'
import { SofaFallback, CoffeeTableFallback, TVFallback, BookshelfFallback } from '../arena3d/models/FallbackModels'

type ViewAngle = 'front' | '45' | 'side' | 'top'
type LightMode = 'day' | 'evening' | 'night'

function getFallbackForAsset(id: ModelAssetId): React.ReactNode {
  switch (id) {
    case 'furniture/loungeSofa':
      return <SofaFallback size={{ x: 2.4, y: 0.9, z: 1.0 }} />
    case 'furniture/tableCoffee':
      return <CoffeeTableFallback size={{ x: 1.4, y: 0.45, z: 0.7 }} />
    case 'furniture/televisionModern':
    case 'furniture/cabinetTelevision':
      return <TVFallback size={{ x: 1.8, y: 1.0, z: 0.15 }} />
    case 'furniture/bookcaseOpen':
      return <BookshelfFallback size={{ x: 0.8, y: 1.8, z: 0.35 }} />
    default:
      return null
  }
}

/** 相机控制器：view angle 切换 */
function CameraRig({ angle }: { angle: ViewAngle }) {
  const { camera } = useThree()
  useEffect(() => {
    switch (angle) {
      case 'front':
        camera.position.set(8, 4, 16)
        break
      case '45':
        camera.position.set(16, 10, 16)
        break
      case 'side':
        camera.position.set(22, 5, 0)
        break
      case 'top':
        camera.position.set(0, 22, 0.01)
        break
    }
    camera.lookAt(6, 0.5, 0)
  }, [angle, camera])
  return null
}

/** 单模型展台：带 runtime AABB 测量（仅首次 scene ready 时）与 label */
function ModelStand({
  assetId,
  index,
  shadowsEnabled,
}: {
  assetId: ModelAssetId
  index: number
  shadowsEnabled: boolean
}) {
  const def = getModelAsset(assetId)
  const standX = index * 3.2
  const groupRef = useRef<THREE.Group>(null)
  const [runtimeAabb, setRuntimeAabb] = useState<Vec3 | null>(null)
  const [verdict, setVerdict] = useState<'PENDING' | 'PASS' | 'WARN' | 'FAIL' | 'LOAD_FAIL'>('PENDING')
  const [deltaStr, setDeltaStr] = useState<string>('')

  // 第一次 ref 有 children 时测一次 AABB
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      if (cancelled) return
      const g = groupRef.current
      if (!g) return
      try {
        // 遍历 groupRef (包含 RegisteredModel 的嵌套 group)
        const res = measureObjectAabb(g)
        if (!cancelled) {
          setRuntimeAabb(res.size)
          const c = compareAabb(res.size, def.effectiveAabb, 0.01, 0.03)
          setVerdict(c.verdict)
          const parts = c.perAxis.map((p) => `${p.axis}:${p.delta.toFixed(4)}${p.verdict[0]}`).join(' ')
          setDeltaStr(`Δmax=${c.maxAbsDelta.toFixed(4)} ${parts}`)
        }
      } catch (_e) {
        // 测不到：LOAD_FAIL (fallback active)
        if (!cancelled) setVerdict('LOAD_FAIL')
      }
    }, 1500) // 等待 GLB fetch
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [def.effectiveAabb.x, def.effectiveAabb.y, def.effectiveAabb.z])

  const verdictColor =
    verdict === 'PASS' ? '#10b981' :
    verdict === 'WARN' ? '#f59e0b' :
    verdict === 'FAIL' || verdict === 'LOAD_FAIL' ? '#ef4444' : '#94a3b8'

  const labels = [
    def.sourceStem,
    `raw: ${fmt(def.rawAabb)}`,
    `uScale: ${def.uniformScale}`,
    `expected eff: ${fmt(def.effectiveAabb)}`,
    runtimeAabb ? `runtime eff: ${fmt(runtimeAabb)}` : 'runtime eff: measuring…',
    `pivot: ${fmt(def.pivotOffset)}`,
    deltaStr,
    `verdict: ${verdict}`,
  ]

  return (
    <group position={[standX, 0, 0]}>
      {/* 地面 4x4 tile */}
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={shadowsEnabled}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#1f2937" roughness={0.95} />
      </mesh>
      {/* 参考 1m cube */}
      <group position={[-1.4, 0.5, -1.2]}>
        <mesh castShadow={shadowsEnabled}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#f3f4f6" wireframe />
        </mesh>
      </group>

      {/* Model + label 容器 ref 用于 runtime AABB 测量 */}
      <group ref={groupRef}>
        <RegisteredModel
          assetId={assetId}
          position={[0, 0, 0.4]}
          rotationY={0}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
          fallback={getFallbackForAsset(assetId)}
        />
      </group>

      {/* Labels (billboard 2D text) */}
      {labels.map((t, i) => (
        <Text
          key={i}
          position={[0, 2.2 - i * 0.22, 0]}
          fontSize={0.14}
          color={i === labels.length - 1 ? verdictColor : '#e5e7eb'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#0b0f19"
        >
          {t}
        </Text>
      ))}
    </group>
  )
}

function fmt(v: Vec3): string {
  return `${v.x.toFixed(3)} × ${v.y.toFixed(3)} × ${v.z.toFixed(3)}`
}

function Lights({ mode, shadowsEnabled }: { mode: LightMode; shadowsEnabled: boolean }) {
  const palette = {
    day:     { ambient: 0xffffff, ambientI: 0.55, dir: 0xfff8ec, dirI: 0.7, p1: 0xffffff, p1I: 0.25, p2: 0xe0f2ff, p2I: 0.15, bg: '#bfdbfe' },
    evening: { ambient: 0xffe3c2, ambientI: 0.45, dir: 0xffc07a, dirI: 0.6, p1: 0xff9f43, p1I: 0.35, p2: 0xffd27a, p2I: 0.2,  bg: '#7c2d12' },
    night:   { ambient: 0x1e1b4b, ambientI: 0.28, dir: 0xc7d2fe, dirI: 0.35, p1: 0xfef08a, p1I: 0.45, p2: 0xc4b5fd, p2I: 0.3, bg: '#0b0f19' },
  }[mode]

  // Set background via scene is handled by color attach below; palette.bg passed as prop
  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <ambientLight intensity={palette.ambientI} color={palette.ambient} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={palette.dirI}
        color={palette.dir}
        castShadow={shadowsEnabled}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {/* 最多 2 个 real-time point light */}
      <pointLight position={[-6, 3, -2]} color={palette.p1} intensity={palette.p1I} distance={18} />
      <pointLight position={[18, 3, 4]} color={palette.p2} intensity={palette.p2I} distance={18} />
    </>
  )
}

export function AssetCalibrationView() {
  const [angle, setAngle] = useState<ViewAngle>('45')
  const [mode, setMode] = useState<LightMode>('day')
  const [shadows, setShadows] = useState(true)

  const viewAngles: { k: ViewAngle; label: string }[] = [
    { k: 'front', label: 'Front' },
    { k: '45', label: '45°' },
    { k: 'side', label: 'Side' },
    { k: 'top', label: 'Top' },
  ]
  const lightModes: { k: LightMode; label: string }[] = [
    { k: 'day', label: 'Neutral Daylight' },
    { k: 'evening', label: 'Warm Evening' },
    { k: 'night', label: 'Nostalgic Night' },
  ]

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white">
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-wrap gap-3 items-center p-3 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="text-sm font-bold text-amber-300">
          WP0A Asset Calibration (DEV ONLY · ?assetCalibration=1)
        </div>

        <div className="flex gap-1">
          <span className="text-xs text-slate-400 self-center mr-1">View:</span>
          {viewAngles.map((v) => (
            <button
              key={v.k}
              onClick={() => setAngle(v.k)}
              className={`text-xs px-2 py-1 rounded border ${angle === v.k ? 'bg-amber-400 text-slate-900 border-amber-300' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <span className="text-xs text-slate-400 self-center mr-1">Light:</span>
          {lightModes.map((v) => (
            <button
              key={v.k}
              onClick={() => setMode(v.k)}
              className={`text-xs px-2 py-1 rounded border ${mode === v.k ? 'bg-sky-400 text-slate-900 border-sky-300' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={shadows} onChange={(e) => setShadows(e.target.checked)} />
          Shadows (uncheck = perf)
        </label>

        <div className="ml-auto text-xs text-slate-400">
          Runtime Box3 compared vs registry effectiveAabb: PASS ≤0.01m, WARN ≤0.03m, FAIL &gt;0.03m
        </div>
      </div>

      <div
        className="absolute inset-0 pt-12"
        style={{ backgroundColor: '#0f152a' }}
      >
        <Canvas
          shadows={shadows}
          camera={{ position: [16, 10, 16], fov: 50 }}
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
          style={{
            background: '#0f152a',
            display: 'block',
            width: '100%',
            height: '100%',
            visibility: 'visible',
            opacity: 1,
          }}
        >
          <CameraRig angle={angle} />
          <OrbitControls target={[6, 0.8, 0]} makeDefault />

          <Lights mode={mode} shadowsEnabled={shadows} />

          {/* 大范围地面 grid 参考 */}
          <Grid
            position={[6, 0, 0]}
            args={[40, 20]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#334155"
            sectionSize={5}
            sectionThickness={1.2}
            sectionColor="#64748b"
            fadeDistance={50}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={false}
          />

          {WP0A_LIVING_ASSET_IDS.map((id, i) => (
            <ModelStand key={id} assetId={id} index={i} shadowsEnabled={shadows} />
          ))}
        </Canvas>
      </div>
    </div>
  )
}

/** §十 gate helper：Scene3D 只在 gate 通过时渲染本组件 */
export function shouldShowAssetCalibration(): boolean {
  try {
    const env = import.meta.env
    if (!env?.DEV) return false
    const search = typeof window !== 'undefined' ? window.location.search : ''
    return /[?&]assetCalibration=(1|true|yes)/i.test(search)
  } catch {
    return false
  }
}

function _treeShakeGates() {
  // ensure imports used
  void useMemo
  void compareAabb
}
_treeShakeGates()
