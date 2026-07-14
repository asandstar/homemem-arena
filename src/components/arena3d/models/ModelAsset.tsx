import { useRef, useMemo, Component } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_REGISTRY, getModelConfig } from './ModelRegistry'
import { MATERIAL_CONFIG, PALETTE } from '../colors'

interface ModelAssetProps {
  modelId: string
  color?: string
  hovered?: boolean
  selected?: boolean
  interactable?: boolean
  target?: boolean
  children?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ModelErrorBoundary extends Component<
  { fallback: React.ComponentType<any>; modelId: string; color?: string; hovered?: boolean; selected?: boolean; children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { fallback: React.ComponentType<any>; modelId: string; color?: string; hovered?: boolean; selected?: boolean; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn(`ModelAsset load error for ${this.props.modelId}:`, error)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      return (
        <FallbackColorizer
          modelId={this.props.modelId}
          color={this.props.color}
          hovered={this.props.hovered}
          selected={this.props.selected}
        >
          <FallbackComponent />
        </FallbackColorizer>
      )
    }
    return this.props.children
  }
}

const FALLBACK_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  key: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
  phone: { primary: '#374151', secondary: '#1f2937', accent: '#10b981' },
  umbrella: { primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
  milk_carton: { primary: '#fef9c3', secondary: '#fef08a', accent: '#4f46e5' },
  cereal_box: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fef3c7' },
  cup: { primary: '#f87171', secondary: '#ef4444', accent: '#fecaca' },
  bowl: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
  plate: { primary: '#fef3c7', secondary: '#fde68a', accent: '#fffbeb' },
  remote: { primary: '#6b7280', secondary: '#4b5563', accent: '#9ca3af' },
  cloth_white: { primary: '#fef3c7', secondary: '#fde68a', accent: '#fffbeb' },
  cloth_dark: { primary: '#6b21a8', secondary: '#581c87', accent: '#9333ea' },
  towel: { primary: '#3b82f6', secondary: '#2563eb', accent: '#93c5fd' },
  trash: { primary: '#78350f', secondary: '#451a03', accent: '#92400e' },
  fridge: { primary: '#e5e7eb', secondary: '#d1d5db', accent: '#f3f4f6' },
  cabinet: { primary: '#8b7355', secondary: '#6b5a47', accent: '#a89070' },
  sink: { primary: '#d1d5db', secondary: '#9ca3af', accent: '#e5e7eb' },
  dishwasher: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
  sofa: { primary: '#a8a29e', secondary: '#78716c', accent: '#d6d3d1' },
  coffee_table: { primary: '#8b7355', secondary: '#6b5a47', accent: '#a89070' },
  bed: { primary: '#fef3c7', secondary: '#fde68a', accent: '#fffbeb' },
  desk: { primary: '#8b7355', secondary: '#6b5a47', accent: '#a89070' },
  laundry_basket: { primary: '#a89070', secondary: '#8b7355', accent: '#c4b89a' },
  entrance_tray: { primary: '#8b7355', secondary: '#6b5a47', accent: '#d4a574' },
  lamp: { primary: '#654321', secondary: '#4a3015', accent: '#fef3c7' },
  plant: { primary: '#6b8e23', secondary: '#556b2f', accent: '#9acd32' },
  rug: { primary: '#b8860b', secondary: '#8b6914', accent: '#daa520' },
  pillow: { primary: '#fbcfe8', secondary: '#f9a8d4', accent: '#fce7f3' },
  shoes: { primary: '#654321', secondary: '#4a3015', accent: '#8b5a2b' },
  hook: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
}

function getFallbackColors(modelId: string) {
  return FALLBACK_COLORS[modelId] || { primary: '#a8a29e', secondary: '#78716c', accent: '#d6d3d1' }
}

export function FallbackColorizer({ modelId, color, hovered, selected, children }: {
  modelId: string
  color?: string
  hovered?: boolean
  selected?: boolean
  children: ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const config = getModelConfig(modelId)
  const colors = getFallbackColors(modelId)

  useFrame((_, delta) => {
    timeRef.current += delta
    
    if (!groupRef.current) return
    
    const highlightColor = config?.highlightColor || PALETTE.status.info
    const materialType = config?.materialType || 'plastic'
    const matConfig = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG.plastic
    
    let meshIndex = 0
    let needsColorize = false
    
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const isStandard = child.material instanceof THREE.MeshStandardMaterial
        
        if (!isStandard || !(child.material as any)._fallbackColored) {
          needsColorize = true
        }
        meshIndex++
      }
    })
    
    if (needsColorize) {
      meshIndex = 0
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = config?.castShadow ?? true
          child.receiveShadow = config?.receiveShadow ?? false
          
          let meshColor: string
          if (color) {
            meshColor = color
          } else {
            const colorOptions = [colors.primary, colors.secondary, colors.accent]
            meshColor = colorOptions[meshIndex % colorOptions.length]
          }
          
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.set(meshColor)
            child.material.roughness = matConfig.roughness
            child.material.metalness = matConfig.metalness
            if (matConfig.emissive) {
              child.material.emissive.set(matConfig.emissive)
              child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
            }
            ;(child.material as any)._fallbackColored = true
          } else {
            const newMat = new THREE.MeshStandardMaterial({
              color: meshColor,
              roughness: matConfig.roughness,
              metalness: matConfig.metalness,
            })
            if (matConfig.emissive) {
              newMat.emissive.set(matConfig.emissive)
              newMat.emissiveIntensity = matConfig.emissiveIntensity || 0
            }
            ;(newMat as any)._fallbackColored = true
            child.material = newMat
          }
          
          meshIndex++
        }
      })
    }
    
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (selected) {
          child.material.emissive.set(highlightColor)
          child.material.emissiveIntensity = 0.6
        } else if (hovered) {
          child.material.emissive.set(highlightColor)
          child.material.emissiveIntensity = 0.3
        } else {
          child.material.emissive.set(matConfig.emissive || '#000000')
          child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
        }
      }
    })
  })

  return <group ref={groupRef}>{children}</group>
}

function ModelContent({
  modelId,
  color,
  hovered,
  selected,
  interactable,
  target,
  children,
}: ModelAssetProps) {
  const config = getModelConfig(modelId)
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  const fallbackComponent = config?.fallback || MODEL_REGISTRY.key.fallback

  const { scene } = useGLTF(config?.path || MODEL_REGISTRY.key.path)

  const clonedScene = useMemo(() => {
    if (!scene) return null
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = config?.castShadow ?? true
        child.receiveShadow = config?.receiveShadow ?? false
        child.geometry.computeVertexNormals()
        child.geometry.normalizeNormals()

        const materialType = config?.materialType || 'plastic'
        const matConfig = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG.plastic

        const applyPixelStyle = (mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial ||
              mat instanceof THREE.MeshPhysicalMaterial ||
              mat instanceof THREE.MeshPhongMaterial ||
              mat instanceof THREE.MeshLambertMaterial) {
            mat.flatShading = true
            if (mat instanceof THREE.MeshStandardMaterial ||
                mat instanceof THREE.MeshPhysicalMaterial) {
              mat.roughness = 0.8
              mat.metalness = 0.1
            }
            if (mat.map) {
              mat.map.minFilter = THREE.NearestFilter
              mat.map.magFilter = THREE.NearestFilter
              mat.map.generateMipmaps = false
            }
            if (mat.emissiveMap) {
              mat.emissiveMap.minFilter = THREE.NearestFilter
              mat.emissiveMap.magFilter = THREE.NearestFilter
              mat.emissiveMap.generateMipmaps = false
            }
            if (mat.aoMap) {
              mat.aoMap.minFilter = THREE.NearestFilter
              mat.aoMap.magFilter = THREE.NearestFilter
            }
          }
        }

        if (child.material instanceof THREE.MeshStandardMaterial ||
            child.material instanceof THREE.MeshPhysicalMaterial) {
          child.material.roughness = matConfig.roughness
          child.material.metalness = matConfig.metalness
          if (matConfig.emissive) {
            child.material.emissive.set(matConfig.emissive)
            child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
          }
          if (color) {
            child.material.color.set(color)
          }
          applyPixelStyle(child.material)
        } else if (child.material instanceof THREE.MeshPhongMaterial) {
          child.material.shininess = 10
          if (color) {
            child.material.color.set(color)
          }
          applyPixelStyle(child.material)
        } else if (child.material instanceof THREE.MeshLambertMaterial) {
          if (color) {
            child.material.color.set(color)
          }
          applyPixelStyle(child.material)
        } else if (child.material instanceof THREE.MeshBasicMaterial) {
          if (color) {
            child.material.color.set(color)
          }
          applyPixelStyle(child.material)
        } else {
          const newMat = new THREE.MeshStandardMaterial({
            color: color || '#a8a29e',
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true,
          })
          if (matConfig.emissive) {
            newMat.emissive.set(matConfig.emissive)
            newMat.emissiveIntensity = matConfig.emissiveIntensity || 0
          }
          child.material = newMat
        }
      }
    })
    return clone
  }, [scene, config, color])

  useFrame((_, delta) => {
    timeRef.current += delta

    if (groupRef.current) {
      if (interactable) {
        const breathe = 1 + Math.sin(timeRef.current * 2) * 0.02
        groupRef.current.scale.setScalar(breathe * (config?.scale || 1))
      } else {
        groupRef.current.scale.setScalar(selected ? 1.05 * (config?.scale || 1) : (config?.scale || 1))
      }
    }

    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const highlightColor = config?.highlightColor || '#3b82f6'

          if (child.material instanceof THREE.MeshStandardMaterial ||
              child.material instanceof THREE.MeshPhysicalMaterial) {
            if (selected) {
              child.material.emissive.set(highlightColor)
              child.material.emissiveIntensity = 0.6
            } else if (hovered) {
              child.material.emissive.set(highlightColor)
              child.material.emissiveIntensity = 0.3
            } else {
              const materialType = config?.materialType || 'plastic'
              const matConfig = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG.plastic
              child.material.emissive.set(matConfig.emissive || '#000000')
              child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
            }
          } else if (child.material instanceof THREE.MeshPhongMaterial ||
                     child.material instanceof THREE.MeshLambertMaterial) {
            if (selected) {
              child.material.emissive?.set(highlightColor)
              child.material.emissiveIntensity = 0.6
            } else if (hovered) {
              child.material.emissive?.set(highlightColor)
              child.material.emissiveIntensity = 0.3
            } else {
              child.material.emissive?.set('#000000')
              child.material.emissiveIntensity = 0
            }
          }
        }
      })
    }
  })

  const FallbackComp = fallbackComponent

  if (!clonedScene || !config) {
    return (
      <FallbackColorizer modelId={modelId} color={color} hovered={hovered} selected={selected}>
        <FallbackComp />
      </FallbackColorizer>
    )
  }

  const heightOffset = config.heightOffset || 0
  const rotation = config.rotation || [0, 0, 0]

  return (
    <group ref={groupRef} position={[0, heightOffset, 0]} rotation={rotation as any}>
      <primitive object={clonedScene} />
      {children}

      {target && (
        <mesh position={[0, -heightOffset + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial
            color={config.highlightColor || '#10b981'}
            transparent
            opacity={0.6 + Math.sin(timeRef.current * 3) * 0.2}
          />
        </mesh>
      )}

      {target && (
        <pointLight
          position={[0, 0.5, 0]}
          color={config.highlightColor || '#10b981'}
          intensity={0.5 + Math.sin(timeRef.current * 2) * 0.2}
          distance={2}
        />
      )}
    </group>
  )
}

export function ModelAsset(props: ModelAssetProps) {
  const config = getModelConfig(props.modelId)
  const FallbackComponent = config?.fallback || MODEL_REGISTRY.key.fallback

  if (config?.assetAvailable === false) {
    return (
      <FallbackColorizer
        modelId={props.modelId}
        color={props.color}
        hovered={props.hovered}
        selected={props.selected}
      >
        <FallbackComponent />
      </FallbackColorizer>
    )
  }

  return (
    <ModelErrorBoundary
      fallback={FallbackComponent}
      modelId={props.modelId}
      color={props.color}
      hovered={props.hovered}
      selected={props.selected}
    >
      <ModelContent {...props} />
    </ModelErrorBoundary>
  )
}
