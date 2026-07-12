import type { RoomSpec, RoomId } from '../types/room'

export const sharedRooms: Record<RoomId, RoomSpec> = {
  living: {
    id: 'living',
    name: '客厅',
    center: { x: 0, y: 0, z: 0 },
    size: { x: 8, y: 3, z: 8 },
    ambientColor: '#fff7e6',
    floorColor: '#d4a574',
    wallColor: '#fff0c8',
    doorways: [
      {
        offset: { x: -4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'bedroom',
        targetPosition: { x: 3.25, y: 0, z: 0 },
      },
      {
        offset: { x: 4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'kitchen',
        targetPosition: { x: -3.25, y: 0, z: 0 },
      },
      {
        offset: { x: 0, y: 0, z: 4 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'entrance',
        targetPosition: { x: 0, y: 0, z: -2.5 },
      },
    ],
  },
  bedroom: {
    id: 'bedroom',
    name: '卧室',
    center: { x: -8, y: 0, z: 0 },
    size: { x: 8, y: 3, z: 8 },
    ambientColor: '#fce7f3',
    floorColor: '#c4a7a7',
    wallColor: '#fce7f3',
    doorways: [
      {
        offset: { x: 4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: -3.25, y: 0, z: 0 },
      },
    ],
  },
  kitchen: {
    id: 'kitchen',
    name: '厨房',
    center: { x: 8, y: 0, z: 0 },
    size: { x: 8, y: 3, z: 8 },
    ambientColor: '#dbeafe',
    floorColor: '#a5b4fc',
    wallColor: '#e0f2fe',
    doorways: [
      {
        offset: { x: -4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: 3.25, y: 0, z: 0 },
      },
      {
        offset: { x: 4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'dining',
        targetPosition: { x: -3.25, y: 0, z: 0 },
      },
    ],
  },
  entrance: {
    id: 'entrance',
    name: '玄关',
    center: { x: 0, y: 0, z: 8 },
    size: { x: 6, y: 3, z: 6 },
    ambientColor: '#d1fae5',
    floorColor: '#86efac',
    wallColor: '#ecfdf5',
    doorways: [
      {
        offset: { x: 0, y: 0, z: -3 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: 0, y: 0, z: 3.5 },
      },
    ],
  },
  laundry: {
    id: 'laundry',
    name: '洗衣房',
    center: { x: 24, y: 0, z: 0 },
    size: { x: 8, y: 3, z: 8 },
    ambientColor: '#e0e7ff',
    floorColor: '#c7d2fe',
    wallColor: '#eef2ff',
    doorways: [
      {
        offset: { x: -4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'dining',
        targetPosition: { x: 3.25, y: 0, z: 0 },
      },
    ],
  },
  dining: {
    id: 'dining',
    name: '餐厅',
    center: { x: 16, y: 0, z: 0 },
    size: { x: 8, y: 3, z: 8 },
    ambientColor: '#fef3c7',
    floorColor: '#fcd34d',
    wallColor: '#fffbeb',
    doorways: [
      {
        offset: { x: -4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'kitchen',
        targetPosition: { x: 3.25, y: 0, z: 0 },
      },
      {
        offset: { x: 4, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'laundry',
        targetPosition: { x: -3.25, y: 0, z: 0 },
      },
    ],
  },
}

export const roomList: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'laundry', 'dining']
