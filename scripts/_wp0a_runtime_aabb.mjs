// scripts/_wp0a_runtime_aabb.mjs
// WP0A §7 runtime AABB 测量：node 层复现 §九 measureObjectAabb（纯 THREE + GLTFLoader）
// 把模型文件加载、apply registry 的 uniformScale + pivotOffset，再用 THREE.Box3.setFromObject 测。
// 与浏览器内 calibration view 逻辑一致。输出 per-model PASS|WARN|FAIL。
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// —— 从 modelRegistry.ts 提取需要的字段（避免 TS→JS 编译，字符串解析足够）
const REGISTRY_PATH = resolve(__dirname, '../src/data/assets/modelRegistry.ts')
const src = readFileSync(REGISTRY_PATH, 'utf-8')
function parseEntry(id) {
  const rx = new RegExp(`'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\s*:\\s*\\{([\\s\\S]*?)\\n  \\},`, 'm')
  const m = src.match(rx)
  if (!m) throw new Error(`no registry entry for ${id}`)
  const body = m[1]
  const pick = (k) => {
    const mk = body.match(new RegExp(`${k}:\\s*(\\{[\\s\\S]*?\\}|[^,\\n]+)`, 'm'))
    return mk ? mk[1].trim() : null
  }
  const toVec = (s) => {
    const mm = s.match(/x:\s*([\d.\-]+),\s*y:\s*([\d.\-]+),\s*z:\s*([\d.\-]+)/)
    if (!mm) throw new Error(`bad vec: ${s}`)
    return { x: +mm[1], y: +mm[2], z: +mm[3] }
  }
  return {
    id,
    url: pick('url')?.replace(/^['"]|['"]$/g, ''),
    rawAabb: toVec(pick('rawAabb')),
    uniformScale: +pick('uniformScale'),
    pivotOffset: toVec(pick('pivotOffset')),
    effectiveAabb: toVec(pick('effectiveAabb')),
    sourceStem: pick('sourceStem')?.replace(/^['"]|['"]$/g, ''),
  }
}
const IDS = [
  'furniture/loungeSofa',
  'furniture/tableCoffee',
  'furniture/televisionModern',
  'furniture/cabinetTelevision',
  'furniture/bookcaseOpen',
]
const registry = Object.fromEntries(IDS.map(id => [id, parseEntry(id)]))

// —— loader helper (use same fetch→GLTFLoader.parse idea, but local fs)
function loadGlbLocalSync(absPath) {
  const buf = readFileSync(absPath).buffer
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buf, '', resolve, reject)
  })
}

function measure(object) {
  const box = new THREE.Box3()
  object.updateMatrixWorld(true)
  box.setFromObject(object)
  const size = new THREE.Vector3(); box.getSize(size)
  const min = box.min.clone(), max = box.max.clone()
  return {
    size: { x: size.x, y: size.y, z: size.z },
    min: { x: min.x, y: min.y, z: min.z },
    max: { x: max.x, y: max.y, z: max.z },
  }
}

function compare(actual, expected, passTol = 0.01, warnTol = 0.03) {
  const axes = ['x', 'y', 'z']
  let verdict = 'PASS', maxAbs = 0
  const perAxis = axes.map(axis => {
    const d = Math.abs(actual[axis] - expected[axis])
    if (!Number.isFinite(d)) { verdict = 'FAIL'; return { axis, delta: NaN, verdict: 'FAIL' } }
    if (d > maxAbs) maxAbs = d
    let v = 'PASS'
    if (d > warnTol) v = 'FAIL'
    else if (d > passTol) v = 'WARN'
    if (v === 'FAIL') verdict = 'FAIL'
    else if (v === 'WARN' && verdict === 'PASS') verdict = 'WARN'
    return { axis, delta: d, verdict: v }
  })
  return { verdict, perAxis, maxAbsDelta: maxAbs }
}

async function main() {
  const publicBase = resolve(__dirname, '../public')
  const rows = []
  for (const id of IDS) {
    const def = registry[id]
    const absGlb = resolve(publicBase, '.' + def.url)
    const gltf = await loadGlbLocalSync(absGlb)
    const scene = gltf.scene.clone(true)

    // Replicate RegisteredModel nesting:
    // outer(pos/rot) → scale(uniformScale) → inner(pivotOffset) → primitive
    const outer = new THREE.Group()
    const scale = new THREE.Group(); scale.scale.setScalar(def.uniformScale)
    const inner = new THREE.Group(); inner.position.set(def.pivotOffset.x, def.pivotOffset.y, def.pivotOffset.z)
    inner.add(scene); scale.add(inner); outer.add(scale)

    // For televisionModern: emulate Room3D.tsx y=0.8 placement atop TV cabinet
    if (id === 'furniture/televisionModern') {
      outer.position.set(0, 0.8, 0)
    }

    const meas = measure(outer)
    const cmp = compare(meas.size, def.effectiveAabb)
    rows.push({
      id,
      sourceStem: def.sourceStem,
      uniformScale: def.uniformScale,
      expectedEff: def.effectiveAabb,
      runtimeEff: meas.size,
      runtimeMin: meas.min,
      runtimeMax: meas.max,
      cmp,
      bottomY: meas.min.y,
    })
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: 'node_runtime_box3_setFromObject',
    overall: rows.every(r => r.cmp.verdict === 'PASS') ? 'PASS' : rows.some(r => r.cmp.verdict === 'FAIL') ? 'FAIL' : 'WARN',
    rows,
  }
  console.log(JSON.stringify(summary, null, 2))
}
main().catch(e => { console.error(e); process.exit(1) })
