import { useRef, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PixelationPassProps {
  pixelSize?: number
  /** （可选）通过 ref 对外暴露像素化后的 RenderTarget.texture，给下游后处理 Pass 进一步叠用。 */
  outputTextureRef?: MutableRefObject<THREE.Texture | null>
  /** 若为 true，本 Pass 把像素化结果再渲染到 default framebuffer（默认 true）。
   *  如果 MemoryModulationPass 等下游 Pass 会把 pixelated texture 作为 tDiffuse 再画到屏幕，就可以设为 false 避免多余一次 draw。
   */
  drawToScreen?: boolean
}

export function PixelationPass({
  pixelSize = 4,
  outputTextureRef,
  drawToScreen = true,
}: PixelationPassProps) {
  const { gl, scene, camera, size } = useThree()
  const pixelMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const quadRef = useRef<THREE.Mesh>(null)
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null)

  useEffect(() => {
    const target = new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    })
    renderTargetRef.current = target

    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: target.texture },
        pixelSize: { value: pixelSize },
        resolution: { value: new THREE.Vector2(size.width, size.height) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float pixelSize;
        uniform vec2 resolution;
        varying vec2 vUv;
        void main() {
          vec2 dxy = pixelSize / resolution;
          vec2 coord = dxy * floor(vUv * resolution / pixelSize);
          gl_FragColor = texture2D(tDiffuse, coord);
        }
      `,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })
    pixelMaterialRef.current = material

    if (outputTextureRef) outputTextureRef.current = target.texture

    return () => {
      target.dispose()
      material.dispose()
      if (outputTextureRef && outputTextureRef.current === target.texture) outputTextureRef.current = null
    }
  }, [pixelSize, size.width, size.height, outputTextureRef])

  useFrame(() => {
    if (!renderTargetRef.current || !pixelMaterialRef.current || !quadRef.current) return

    gl.setRenderTarget(renderTargetRef.current)
    gl.render(scene, camera)
    gl.setRenderTarget(null)

    pixelMaterialRef.current.uniforms.tDiffuse.value = renderTargetRef.current.texture

    if (drawToScreen) {
      gl.autoClear = false
      gl.clearDepth()
      quadRef.current.material = pixelMaterialRef.current
      gl.render(quadRef.current, camera)
      gl.autoClear = true
    }
  })

  return (
    <mesh ref={quadRef}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial />
    </mesh>
  )
}
