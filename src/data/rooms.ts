import type { RoomSpec, RoomId } from '../types/room'

// A1.5 Compact Hub Layout (120.81㎡, 5 rooms)
// Topology: Bedroom(-X) ↔ Living(hub) ↔ Entrance(+X south shift)
//           Living ↔ DiningKitchen(-Z) ↔ Laundry(+X of DK)
// All doorways: width 1.4m, height 2.4m
// targetPosition is room-local (relative to target room center)
export const sharedRooms: Record<RoomId, RoomSpec> = {
  living: {
    id: 'living',
    name: '客厅',
    center: { x: 0, y: 0, z: 0 },
    size: { x: 6.5, y: 3, z: 5.5 },
    ambientColor: '#fff7e6',
    floorColor: '#d4a574',
    wallColor: '#fff0c8',
    doorways: [
      {
        offset: { x: -3.25, y: 0, z: 0 },
        width: 1.4,
        height: 2.4,
        connectsTo: 'bedroom',
        targetPosition: { x: 1.85, y: 0, z: 0 },
      },
      {
        offset: { x: 3.25, y: 0, z: -1.1 },
        width: 1.4,
        height: 2.4,
        connectsTo: 'entrance',
        targetPosition: { x: 2.25, y: 0, z: -1.1 },
      },
      {
        offset: { x: 0, y: 0, z: -2.75 },
        width: 1.4,
        height: 2.4,
        connectsTo: 'dining',
        targetPosition: { x: 0, y: 0, z: 2.05 },
      },
    ],
  },
  bedroom: {
    id: 'bedroom',
    name: '卧室',
    center: { x: -5.65, y: 0, z: 0 },
    size: { x: 4.8, y: 3, z: 5.2 },
    ambientColor: '#fce7f3',
    floorColor: '#c4a7a7',
    wallColor: '#fce7f3',
    doorways: [
      {
        offset: { x: 2.4, y: 0, z: 0 },
        width: 1.4,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: -2.7, y: 0, z: 0 },
      },
    ],
  },
  dining: {
    id: 'dining',
    name: '餐厨',
    center: { x: 0, y: 0, z: -5.35 },
    size: { x: 5.5, y: 3, z: 5.2 },
    ambientColor: '#fef3c7',
    floorColor: '#e8d5a8',
    wallColor: '#fffbeb',
    doorways: [
      {
        offset: { x: 0, y: 0, z: 2.6 },
        width: 1.4,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: 0, y: 0, z: -2.2 },
      },
      {
        offset: { x: 2.75, y: 0, z: -0.25 },
        width: 1.4,
        height: 2.4,
        connectsTo: 'laundry',
        targetPosition: { x: -1.45, y: 0, z: 0 },
      },
    ],
  },
  entrance: {
    id: 'entrance',
    name: '玄关',
    center: { x: 4.75, y: 0, z: -1.625 },
    size: { x: 3.0, y: 3, z: 4.5 },
    ambientColor: '#d1fae5',
    floorColor: '#86efac',
    wallColor: '#ecfdf5',
    doorways: [
      {
        offset: { x: -1.5, y: 0, z: 0.525 },
        width: 1.4,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: 3.75, y: 0, z: -1.1 },
      },
    ],
  },
  laundry: {
    id: 'laundry',
    name: '洗衣房',
    center: { x: 4.75, y: 0, z: -6.125 },
    size: { x: 4.0, y: 3, z: 4.5 },
    ambientColor: '#e0e7ff',
    floorColor: '#a5b4fc',
    wallColor: '#eef2ff',
    doorways: [
      // 西墙接 dining 东墙（共享墙 x=2.75，门洞中心 z=-5.6 世界 → laundry 局部 z=0.525）
      {
        offset: { x: -2.0, y: 0, z: 0.525 },
        connectsTo: 'dining',
        width: 1.4,
        height: 2.4,
        targetPosition: { x: -1.45, y: 0, z: 0.525 },
      },
    ],
  },
}

export const roomList: RoomId[] = ['living', 'bedroom', 'entrance', 'laundry', 'dining']
