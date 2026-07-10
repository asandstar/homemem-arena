import type { RoomId, Vec3 } from '../types/room'

export interface DecorFurnitureSpec {
  id: string
  position: Vec3
  size: Vec3
}

export const roomDecorFurniture: Record<RoomId, DecorFurnitureSpec[]> = {
  living: [
    {
      id: 'decor-sofa',
      position: { x: -2.0, y: 0, z: 2.0 },
      size: { x: 2.2, y: 0.9, z: 0.9 },
    },
    {
      id: 'decor-coffee-table',
      position: { x: -2.0, y: 0, z: 1.0 },
      size: { x: 1.2, y: 0.4, z: 0.6 },
    },
    {
      id: 'decor-tv-stand',
      position: { x: 2.0, y: 0, z: -2.4 },
      size: { x: 2.0, y: 0.5, z: 0.4 },
    },
  ],
  bedroom: [
    {
      id: 'decor-bed',
      position: { x: 0, y: 0, z: -0.5 },
      size: { x: 1.8, y: 1.0, z: 2.2 },
    },
    {
      id: 'decor-nightstand-left',
      position: { x: -2.2, y: 0, z: -1.3 },
      size: { x: 0.5, y: 0.55, z: 0.4 },
    },
    {
      id: 'decor-nightstand-right',
      position: { x: 1.3, y: 0, z: -1.3 },
      size: { x: 0.5, y: 0.55, z: 0.4 },
    },
    {
      id: 'decor-desk',
      position: { x: 1.4, y: 0, z: 0.8 },
      size: { x: 1.2, y: 0.75, z: 0.6 },
    },
    {
      id: 'decor-wardrobe',
      position: { x: -2.2, y: 0, z: 0.8 },
      size: { x: 1.6, y: 2.0, z: 0.6 },
    },
  ],
  kitchen: [
    {
      id: 'decor-counter-left',
      position: { x: -2.5, y: 0, z: -2.2 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-counter-right',
      position: { x: 2.5, y: 0, z: -2.2 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-counter-back',
      position: { x: 0, y: 0, z: 2.4 },
      size: { x: 1.5, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-trash',
      position: { x: 2.4, y: 0, z: 0.5 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
    },
  ],
  entrance: [
    {
      id: 'decor-shoe-cabinet',
      position: { x: -1.5, y: 0, z: -0.3 },
      size: { x: 1.0, y: 1.0, z: 0.35 },
    },
  ],
  laundry: [
    {
      id: 'decor-washer-left',
      position: { x: -0.5, y: 0, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
    },
    {
      id: 'decor-washer-right',
      position: { x: 0.5, y: 0, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
    },
    {
      id: 'decor-basket-red',
      position: { x: -1.0, y: 0, z: -0.3 },
      size: { x: 0.45, y: 0.5, z: 0.45 },
    },
    {
      id: 'decor-basket-blue',
      position: { x: 0, y: 0, z: -0.3 },
      size: { x: 0.45, y: 0.5, z: 0.45 },
    },
    {
      id: 'decor-basket-green',
      position: { x: 1.0, y: 0, z: -0.3 },
      size: { x: 0.45, y: 0.5, z: 0.45 },
    },
    {
      id: 'decor-towel-rack',
      position: { x: 2.6, y: 0, z: 0 },
      size: { x: 1.0, y: 1.5, z: 0.05 },
    },
  ],
  dining: [
    {
      id: 'decor-dining-table',
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1.8, y: 0.9, z: 0.9 },
    },
    {
      id: 'decor-chair-1',
      position: { x: -1.0, y: 0, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
    {
      id: 'decor-chair-2',
      position: { x: 1.0, y: 0, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
    {
      id: 'decor-chair-3',
      position: { x: -1.0, y: 0, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
    {
      id: 'decor-chair-4',
      position: { x: 1.0, y: 0, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
  ],
}
