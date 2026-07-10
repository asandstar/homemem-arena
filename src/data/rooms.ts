import type { RoomSpec, RoomId } from '../types/room'

export const sharedRooms: Record<RoomId, RoomSpec> = {
  living: {
    id: 'living',
    name: '客厅',
    center: { x: 0, y: 0, z: 0 },
    size: { x: 6, y: 3, z: 6 },
    ambientColor: '#fff7e6',
    floorColor: '#d4a574',
    wallColor: '#fff0c8',
    doorways: [
      {
        offset: { x: -3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'bedroom',
        targetPosition: { x: 2.25, y: 0, z: 0 },
      },
      {
        offset: { x: 3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'kitchen',
        targetPosition: { x: -2.25, y: 0, z: 0 },
      },
      {
        offset: { x: 0, y: 0, z: 3 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'entrance',
        targetPosition: { x: 0, y: 0, z: -1.5 },
      },
    ],
  },
  bedroom: {
    id: 'bedroom',
    name: '卧室',
    center: { x: -6, y: 0, z: 0 },
    size: { x: 6, y: 3, z: 6 },
    ambientColor: '#fce7f3',
    floorColor: '#c4a7a7',
    wallColor: '#fce7f3',
    doorways: [
      {
        offset: { x: 3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: -2.25, y: 0, z: 0 },
      },
    ],
  },
  kitchen: {
    id: 'kitchen',
    name: '厨房',
    center: { x: 6, y: 0, z: 0 },
    size: { x: 6, y: 3, z: 6 },
    ambientColor: '#dbeafe',
    floorColor: '#a5b4fc',
    wallColor: '#e0f2fe',
    doorways: [
      {
        offset: { x: -3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: 2.25, y: 0, z: 0 },
      },
      {
        offset: { x: 3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'dining',
        targetPosition: { x: -2.25, y: 0, z: 0 },
      },
    ],
  },
  entrance: {
    id: 'entrance',
    name: '玄关',
    center: { x: 0, y: 0, z: 5 },
    size: { x: 4, y: 3, z: 4 },
    ambientColor: '#d1fae5',
    floorColor: '#86efac',
    wallColor: '#ecfdf5',
    doorways: [
      {
        offset: { x: 0, y: 0, z: -2 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'living',
        targetPosition: { x: 0, y: 0, z: 2.5 },
      },
    ],
  },
  laundry: {
    id: 'laundry',
    name: '洗衣房',
    center: { x: 18, y: 0, z: 0 },
    size: { x: 6, y: 3, z: 6 },
    ambientColor: '#e0e7ff',
    floorColor: '#c7d2fe',
    wallColor: '#eef2ff',
    doorways: [
      {
        offset: { x: -3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'dining',
        targetPosition: { x: 2.25, y: 0, z: 0 },
      },
    ],
  },
  dining: {
    id: 'dining',
    name: '餐厅',
    center: { x: 12, y: 0, z: 0 },
    size: { x: 6, y: 3, z: 6 },
    ambientColor: '#fef3c7',
    floorColor: '#fcd34d',
    wallColor: '#fffbeb',
    doorways: [
      {
        offset: { x: -3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'kitchen',
        targetPosition: { x: 2.25, y: 0, z: 0 },
      },
      {
        offset: { x: 3, y: 0, z: 0 },
        width: 1.5,
        height: 2.4,
        connectsTo: 'laundry',
        targetPosition: { x: -2.25, y: 0, z: 0 },
      },
    ],
  },
}

export const roomList: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'laundry', 'dining']
