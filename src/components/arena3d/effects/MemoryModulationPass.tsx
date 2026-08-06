import { useRef, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../../store/useGameStore'
import type { MemorySlot } from '../../../store/gameTypes'

/**
 * Memory-as-Modulator 后处理 Pass。
 * 研究参考：RoboMem Key Takeaway — "Memory-as-Modulator is the most effective integration strategy for perceptual memory."
 *
 * 感知调制维度：
 * - 平均 confidence 越低 → vignette 越暗
 * - 记忆槽占用越高 → 饱和度越低（desaturation）
 * - outdated 记忆占比越高 → 轻微 3x3 高斯模糊
 * - saveMemory 触发 memoryClearPulseMs → 约 250ms 的"清晰脉冲回冲"（全部调制短暂归零）
 *
 * 用法：如果 PixelationPass 通过 `outputTextureRef` 暴露了 RT，则把同一个 ref 当 `sourceTextureRef` 传进来，
 * MemoryModulationPass 直接采样那个像素化后的 texture，不再重复 render(scene, camera)。
 */

interface MemoryModulationPassProps {
  /** 全局开关：production 默认启用；e2e 禁用防止干扰截图对比 */
  enabled?: boolean
  /** 上游（如 PixelationPass）的 RT texture ref。提供则直接采样，不重复渲染 scene → 节省一次 draw。 */
  sourceTextureRef?: MutableRefObject<THREE.Texture | null>
}

function memoryStats(slots: Array<MemorySlot | null>) {
  let used = 0
  let confSum = 0
  let outdatedCount = 0
  let confCount = 0
  for (const s of slots) {
    if (!s) continue
    used++
    confSum += s.confidence ?? 0
    confCount++
    if (s.outdated) outdatedCount++
  }
  const total = slots.length || 1
  const fillRate = used / total
  const avgConf = confCount === 0 ? 1 : confSum / confCount
  const outdatedRate = used === 0 ? 0 : outdatedCount / used
  return { fillRate, avgConf, outdatedRate }
}

export function MemoryModulationPass({ enabled = true, sourceTextureRef }: MemoryModulationPassProps) {
  const { gl, scene, camera, size } = useThree()
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const quadRef = useRef<THREE.Mesh>(null)
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null)

  const memorySlotsSel = useGameStore((s) => s.memorySlots)
  const clearPulseMsSel = useGameStore((s) => s.memoryClearPulseMs)

  useEffect(() => {
    if (!enabled) return

    // 只有当 sourceTextureRef 未提供时才自建 RT（自己采样 scene 的 fallback 路径）
    let target: THREE.WebGLRenderTarget | null = null
    if (!sourceTextureRef) {
      target = new THREE.WebGLRenderTarget(size.width, size.height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
      })
      renderTargetRef.current = target
    }

    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        resolution: { value: new THREE.Vector2(size.width, size.height) },
        u_vignetteStrength: { value: 0 },
        u_desaturation: { value: 0 },
        u_blur: { value: 0 },
        u_clearPulse: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float u_vignetteStrength;
        uniform float u_desaturation;
        uniform float u_blur;
        uniform float u_clearPulse;
        varying vec2 vUv;

        vec3 sampleBlur(vec2 uv, float radiusPx) {
          vec2 texel = 1.0 / resolution;
          vec3 acc = vec3(0.0);
          float wsum = 0.0;
          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              float w = (abs(x) + abs(y) == 0) ? 4.0 :
                        (abs(x) == 1 && abs(y) == 1) ? 1.0 : 2.0;
              vec2 off = vec2(float(x), float(y)) * texel * radiusPx;
              acc += texture2D(tDiffuse, uv + off).rgb * w;
              wsum += w;
            }
          }
          return acc / max(wsum, 0.0001);
        }

        void main() {
          vec2 uv = vUv;
          float blurRadius = u_blur * 2.2;
          vec3 col = (blurRadius > 0.05) ? sampleBlur(uv, blurRadius) : texture2D(tDiffuse, uv).rgb;

          float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
          vec3 gray = vec3(lum);
          col = mix(col, gray, clamp(u_desaturation, 0.0, 0.75));

          vec2 d = uv - 0.5;
          float r = length(d) * 1.414;
          float vig = 1.0 - smoothstep(0.3, 1.0, r) * u_vignetteStrength;
          col *= clamp(vig, 0.15, 1.0);

          // 清晰脉冲：u_clearPulse∈[0,1]，越大越接近原始（无调制）
          vec3 orig = texture2D(tDiffuse, uv).rgb;
          col = mix(col, orig, clamp(u_clearPulse, 0.0, 1.0));

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
      transparent: false,
    })
    materialRef.current = material

    return () => {
      if (target) target.dispose()
      material.dispose()
    }
  }, [enabled, size.width, size.height, sourceTextureRef])

  useFrame(() => {
    if (!enabled) return
    if (!materialRef.current || !quadRef.current) return

    // 确定 diffuse 来源：优先 sourceTextureRef（上游 Pass 的 texture）
    const src = sourceTextureRef?.current ?? renderTargetRef.current?.texture ?? null
    if (!src) return
    materialRef.current.uniforms.tDiffuse.value = src

    // 如果 sourceTextureRef 没给，则自己先把 scene 渲染到自建 RT 作为 fallback
    if (!sourceTextureRef && renderTargetRef.current) {
      gl.setRenderTarget(renderTargetRef.current)
      gl.render(scene, camera)
      gl.setRenderTarget(null)
    }

    // 计算调制强度
    const { fillRate, avgConf, outdatedRate } = memoryStats(memorySlotsSel)
    let vignetteStrength = (1 - avgConf) * 0.55
    let desaturation = fillRate * 0.5
    let blur = Math.min(1.0, outdatedRate * 0.9 + fillRate * 0.1)

    // 清晰脉冲：saveMemory 后 ~250ms 衰减
    const now = performance.now()
    const pulseAge = clearPulseMsSel > 0 ? now - clearPulseMsSel : 10_000
    const clearPulse = pulseAge < 260 ? Math.exp(-(pulseAge * pulseAge) / 14000) : 0

    materialRef.current.uniforms.u_vignetteStrength.value = vignetteStrength
    materialRef.current.uniforms.u_desaturation.value = desaturation
    materialRef.current.uniforms.u_blur.value = blur
    materialRef.current.uniforms.u_clearPulse.value = clearPulse

    // 画到屏幕（最后一棒）
    gl.autoClear = false
    gl.clearDepth()
    quadRef.current.material = materialRef.current
    gl.render(quadRef.current, camera)
    gl.autoClear = true
  })

  if (!enabled) return null
  return (
    <mesh ref={quadRef}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial />
    </mesh>
  )
}
