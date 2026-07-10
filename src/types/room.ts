// 房间与空间类型 - 3D 坐标系统
// 单位：米
// Y 轴向上，X-Z 平面为地面

export type RoomId = 'living' | 'kitchen' | 'bedroom' | 'entrance' | 'laundry' | 'dining'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface RoomSpec {
  id: RoomId
  name: string
  /** 房间中心点 (地面) */
  center: Vec3
  /** 房间尺寸 (宽×高×深)，X 方向宽，Z 方向深 */
  size: Vec3
  /** 灯光颜色 */
  ambientColor: string
  /** 地板颜色 */
  floorColor: string
  /** 墙壁颜色 */
  wallColor: string
  /** 与其他房间的连接门 (用于导航) */
  doorways: DoorwaySpec[]
}

export interface DoorwaySpec {
  /** 门中心位置 (相对房间中心) */
  offset: Vec3
  /** 门宽 (X 方向) */
  width: number
  /** 门高 (Y 方向) */
  height: number
  /** 通往的房间 ID */
  connectsTo: RoomId
  /** 在新房间中的目标位置 (用于穿门后的机器人位置) */
  targetPosition: Vec3
}
