import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PixelationPassProps {
  pixelSize?: number
}

export function PixelationPass({ pixelSize = 4 }: PixelationPassProps) {
  const { gl, scene, camera, size } = useThree()
  const pixelMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const quadRef = useRef<THREE.Mesh>(null)
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null)

  useEffect(() => {
    const target = new THREE.WebGLRenderTarget(
      size.width,
      size.height,
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
      }
    )
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

    return () => {
      target.dispose()
      material.dispose()
    }
  }, [pixelSize, size.width, size.height])

  useFrame(() => {
    if (!renderTargetRef.current || !pixelMaterialRef.current || !quadRef.current) return

    gl.setRenderTarget(renderTargetRef.current)
    gl.render(scene, camera)
    gl.setRenderTarget(null)

    pixelMaterialRef.current.uniforms.tDiffuse.value = renderTargetRef.current.texture

    gl.autoClear = false
    gl.clearDepth()
    quadRef.current.material = pixelMaterialRef.current
    gl.render(quadRef.current, camera)
    gl.autoClear = true
  })

  return (
    <mesh ref={quadRef}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial />
    </mesh>
  )
}
