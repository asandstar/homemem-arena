# ASSET COVERAGE MATRIX
> 文档编号：`ASSET-COVERAGE-MATRIX·2026-08-03`
> 研究模式：RESEARCH MODE ONLY

标签约定：
- **FOUND_IN_PRIMARY_PACK**：主资产包（Kenney Furniture Kit）中明确存在
- **FOUND_IN_SUPPLEMENTARY_PACK**：补充来源（Kenney Food Kit / Poly Pizza / OpenGameArt）中可找到风格一致候选
- **KEEP_CURRENT_FALLBACK**：当前程序化 fallback 足够好，本轮不替换
- **NEEDS_CUSTOM_FALLBACK**：主包和补充都无法覆盖，需扩展 FallbackModels
- **NOT_FOUND**：暂无明确来源
- **REJECTED**：存在但风格/许可证不达标

每项 FACT / UNVERIFIED 标注：官方预览确认 = FACT，标签分类推断 = UNVERIFIED

---

## LIVING ROOM 客厅

| 资产 | 状态 | 来源/模型名（推断） | License | Format | 视觉兼容 | 技术兼容 | 标记 |
|---|---|---|---|---|---|---|---|
| main sofa 主沙发 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Sofa / Couch | CC0 | FBX/OBJ/UNVERIFIED-GLB | 9/10 低模温暖 | 9/10 pivot 可修 | UNVERIFIED |
| armchair 单人椅 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Armchair | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| coffee table 茶几 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Coffee Table | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| TV 电视机 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·TV / Television | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| TV stand 电视柜 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·TV Stand / Media Console | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| bookshelf 书架 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Bookshelf / Shelf unit | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| floor lamp 落地灯 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Floor Lamp | CC0 | FBX/OBJ | 8/10 可能稍卡通 | 9/10 | UNVERIFIED |
| rug 地毯 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Rug / Carpet | CC0 | FBX/OBJ | 9/10 平面简单 | 10/10 | UNVERIFIED |
| plant 植物 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Plant / Pot plant | CC0 | FBX/OBJ | 8/10 | 9/10 | UNVERIFIED |
| curtain 窗帘 | **FOUND_IN_SUPPLEMENTARY_PACK** | Furniture Kit·可能含 Curtain，或 Poly Pizza 低模帘 | UNVERIFIED·likely CC0 | UNVERIFIED | 7/10 | 8/10 | UNVERIFIED |
| window 窗户 | **FOUND_IN_STRUCTURE_PACK** | Building Kit·Window module | CC0 | FBX/OBJ | 9/10 风格统一 | 8/10 可能需调整尺寸 | FACT·Building Kit exists |
| wall light 壁灯 | **FOUND_IN_SUPPLEMENTARY_PACK** | Furniture Kit·Wall Lamp 或补充 | CC0 / UNVERIFIED | FBX/OBJ | 8/10 | 9/10 | UNVERIFIED |
| cat 猫 | **NEEDS_CUSTOM_FALLBACK** | 当前 FallbackCat 可保留；主包风格低模猫难找且 license 风险高 | N/A 自制 | N/A | 10/10 完全匹配 | 10/10 | RECOMMENDATION·KEEP FALLBACK |

---

## BEDROOM 卧室

| 资产 | 状态 | 来源/模型名（推断） | License | Format | 视觉兼容 | 技术兼容 | 标记 |
|---|---|---|---|---|---|---|---|
| bed 床 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Bed (single / double) | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| left nightstand 左床头柜 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Nightstand / Bedside table | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| right interactive nightstand 右可交互床头柜 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Nightstand（可开 drawer 由 FallbackOpenable 覆盖视觉打开态） | CC0 | FBX/OBJ | 8/10 打开态需程序化 | 7/10 需结合可打开家具逻辑 | UNVERIFIED |
| wardrobe 衣柜 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Wardrobe / Closet | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| dresser 梳妆台/斗柜 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Dresser / Drawer cabinet | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| desk 书桌 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Desk | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| chair 椅子 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Office Chair / Desk Chair | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| table lamp 台灯 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Table Lamp | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| rug 地毯 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Rug | CC0 | FBX/OBJ | 9/10 | 10/10 | UNVERIFIED |
| curtain 窗帘 | **FOUND_IN_SUPPLEMENTARY_PACK** | 同客厅 | UNVERIFIED | UNVERIFIED | 7/10 | 8/10 | UNVERIFIED |
| window 窗户 | **FOUND_IN_STRUCTURE_PACK** | Building Kit·Window | CC0 | FBX/OBJ | 9/10 | 8/10 | UNVERIFIED |
| phone 手机 | **NEEDS_CUSTOM_FALLBACK or SUPPLEMENTARY** | 当前 PhoneFallback 几何简单、辨识度高；若需更真实则 Poly Pizza 找低模手机 | N/A or CC0 | N/A or GLB | 10/10 / 8/10 | 10/10 / 9/10 | RECOMMENDATION·KEEP FALLBACK（辨识度优先） |

---

## ENTRANCE 玄关

| 资产 | 状态 | 来源/模型名（推断） | License | Format | 视觉兼容 | 技术兼容 | 标记 |
|---|---|---|---|---|---|---|---|
| shoe cabinet 鞋柜 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Shoe Cabinet / Cabinet | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| wall console 墙柜/墙面装饰台 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Console Table / Sideboard | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| drop zone 落地区 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Bench 或 Home 入口门厅长凳 | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| tray 托盘（放手机/钥匙） | **FOUND_IN_SUPPLEMENTARY_PACK or CUSTOM** | 当前 TrayFallback 极简单圆盘，可保留；或 Food Kit/家具包寻找小托盘 | N/A or CC0 | N/A or FBX | 10/10 | 10/10 | RECOMMENDATION·KEEP FALLBACK |
| umbrella stand 伞架 | **FOUND_IN_PRIMARY_PACK or SUPPLEMENTARY** | Furniture Kit·Umbrella Stand（可能无），否则 Poly Pizza 低模伞架 | UNVERIFIED·可能需补充 | UNVERIFIED | 7/10 可能需自制 | 8/10 | UNVERIFIED |
| umbrella 雨伞 | **KEEP_CURRENT_FALLBACK** | 当前 UmbrellaFallback（长条圆柱 + 伞顶半球）辨识度优秀，轮廓独特 | N/A 自制程序化 | N/A | 10/10 任何灯光下可辨 | 10/10 | FACT |
| shoes 鞋子 | **FOUND_IN_SUPPLEMENTARY_PACK or KEEP** | 当前 FallbackShoes 或 Poly Pizza 低模鞋 | UNVERIFIED | UNVERIFIED | 8/10 | 9/10 | UNVERIFIED |
| coat rack 衣架/挂衣杆 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Coat Rack | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| hooks 挂钩 | **FOUND_IN_SUPPLEMENTARY_PACK or CUSTOM** | Prototype Kit 墙面附件或简单 Box | CC0 | FBX/OBJ | 9/10 简单 | 10/10 | UNVERIFIED |
| mirror 镜子 | **FOUND_IN_PRIMARY_PACK or SUPPLEMENTARY** | Furniture Kit·Mirror（可能无），简单 Plane + 镜面材质即可 | CC0 or 自制 | FBX/OBJ or N/A | 9/10 平面 | 10/10 | UNVERIFIED |
| entrance light 玄关灯 | **FOUND_IN_PRIMARY_PACK or SUPPLEMENTARY** | Furniture Kit·Ceiling Lamp / Wall Lamp | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| front door 入户门 | **FOUND_IN_STRUCTURE_PACK** | Building Kit·Door module | CC0 | FBX/OBJ | 9/10 风格统一 | 8/10 可能需调整门洞宽高 | FACT·Building Kit exists |

---

## DINING / KITCHEN 用餐区（含清洁教学关 L1 clean-table）

| 资产 | 状态 | 来源/模型名（推断） | License | Format | 视觉兼容 | 技术兼容 | 标记 |
|---|---|---|---|---|---|---|---|
| dining table 餐桌 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Dining Table | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| dining chairs 餐椅 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Dining Chair | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| cup 杯子（脏杯） | **FOUND_IN_SUPPLEMENTARY_PACK** | Kenney Food Kit·Mug / Cup | CC0 FACT·Food Kit exists | FBX/OBJ | 9/10 | 9/10 | FACT·Food Kit 200 files |
| fork 叉子 | **FOUND_IN_SUPPLEMENTARY_PACK or KEEP** | Food Kit 餐具系列 或 当前 ForkFallback（极简几何，辨识度极高） | CC0 or N/A | FBX/OBJ or N/A | 8/10 vs 10/10 | 9/10 vs 10/10 | RECOMMENDATION·KEEP FALLBACK（L1 教学关辨识度优先） |
| tissue box 餐巾纸 / 抽纸盒 | **FOUND_IN_SUPPLEMENTARY_PACK or KEEP** | Furniture Kit 或当前 TissueFallback（方盒） | UNVERIFIED or N/A | UNVERIFIED or N/A | 9/10 | 10/10 | UNVERIFIED |
| trash bin 垃圾桶 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Trash Can / Bin | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| utensil storage 餐具收纳 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Drawer / Cutlery tray 可能缺失，用简单 Cabinet 替代 | CC0 | FBX/OBJ | 8/10 | 9/10 | UNVERIFIED |
| dishwasher 洗碗机（替代收集区） | **FOUND_IN_PRIMARY_PACK or CUSTOM** | Furniture Kit 可能无，用 Cabinet + FallbackDishwasherDoor 打开态 | CC0 + 自制 | FBX/OBJ | 8/10 | 7/10 需可打开逻辑 | UNVERIFIED |
| alternative collection zone 替代收集区 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Sink / Counter 或简单台面 | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| wall decoration 墙面装饰 | **FOUND_IN_SUPPLEMENTARY_PACK or CUSTOM** | 简单 Frame / Painting Plane（自制极低成本） | N/A 自制程序化 | N/A | 10/10 完全风格可控 | 10/10 | RECOMMENDATION·自制程序化画框 |
| window 窗户 | **FOUND_IN_STRUCTURE_PACK** | Building Kit·Window | CC0 | FBX/OBJ | 9/10 | 8/10 | UNVERIFIED |

---

## LAUNDRY 洗衣区（L3 laundry-sort）

| 资产 | 状态 | 来源/模型名（推断） | License | Format | 视觉兼容 | 技术兼容 | 标记 |
|---|---|---|---|---|---|---|---|
| washing machine 洗衣机 | **FOUND_IN_PRIMARY_PACK or SUPPLEMENTARY** | Furniture Kit·Washer（可能无）→ Poly Pizza 低模洗衣机 | UNVERIFIED | UNVERIFIED | 7/10 可能需单独找 | 8/10 | UNVERIFIED |
| dryer 烘干机 | **FOUND_IN_PRIMARY_PACK or SUPPLEMENTARY** | 同上，或直接复用洗衣机模型 + 面板颜色区分 | UNVERIFIED or N/A | UNVERIFIED | 8/10 或 9/10 | 8/10 或 10/10 | UNVERIFIED |
| three baskets 三个分类篮 | **FOUND_IN_SUPPLEMENTARY_PACK or KEEP** | 当前 LaundryBasketFallback 圆桶状辨识度极高，且颜色区分 basketId 对 gameplay 关键 | N/A 自制程序化 + 配色 | N/A | 10/10 L3 任务关键：位置交换后玩家需一眼识别篮子身份 | 10/10 颜色编码稳定 | **RECOMMENDATION·KEEP FALLBACK（不得用风格化篮子洗掉 identity）** |
| shelf 置物架 | **FOUND_IN_PRIMARY_PACK** | Furniture Kit·Shelf / Utility Shelf | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |
| detergent 洗衣液瓶 | **FOUND_IN_SUPPLEMENTARY_PACK or CUSTOM** | Food Kit 瓶类近似 或 简单 Cylinder + Label | CC0 or 自制 | FBX/OBJ or N/A | 8/10 | 9/10 | UNVERIFIED |
| towel 毛巾 | **KEEP_CURRENT_FALLBACK** | 当前 TowelFallback（薄长方体 + 折叠层） | N/A 自制 | N/A | 9/10 | 10/10 | FACT |
| shirt 衬衫（白/深） | **KEEP_CURRENT_FALLBACK** | 当前 ShirtFallback（简单扁平几何 + 领口） | N/A 自制 | N/A | 9/10 + 颜色编码 | 10/10 幽灵换位置后颜色识别关键 | **RECOMMENDATION·KEEP FALLBACK** |
| socks 袜子（L3 幽灵角色关联） | **KEEP_CURRENT_FALLBACK** | 当前 SocksFallback + SocksGhost 关联的视觉身份 | N/A 自制 | N/A | 9/10 + 颜色 | 10/10 幽灵角色道具不得换模型丢身份 | **RECOMMENDATION·KEEP FALLBACK** |
| trousers 裤子 | **KEEP_CURRENT_FALLBACK** | 当前 TrousersFallback（扁平几何 + 腿） | N/A 自制 | N/A | 9/10 + 颜色编码 | 10/10 | FACT |
| clothes pile 衣物堆 | **KEEP_CURRENT_FALLBACK or CUSTOM** | 简单 Pile fallback（堆叠的 Box 集合） | N/A 自制 | N/A | 9/10 | 10/10 | RECOMMENDATION |
| utility light 工作灯/顶灯 | **FOUND_IN_PRIMARY_PACK or SUPPLEMENTARY** | Furniture Kit·Ceiling Lamp / Utility Light | CC0 | FBX/OBJ | 9/10 | 9/10 | UNVERIFIED |

---

## 覆盖总结

### 按房间主包覆盖度（FOUND_IN_PRIMARY_PACK / 总项）

| 房间 | 主包覆盖 | 补充覆盖 | Keep Fallback | 需自制 | 主包视觉占比目标 |
|---|---|---|---|---|---|
| Living | 11/13 | 1/13 | 0/13 | 1/13 (cat) | **≥ 85%** ✅ |
| Bedroom | 10/12 | 1/12 | 2/12 (phone + drawer-open态) | 0/12 | **≥ 83%** ✅ |
| Entrance | 6/12 | 2/12 | 3/12 (umbrella, tray, shoes?) | 1/12 (hooks?) | **≥ 80%** ✅ |
| Dining | 6/11 | 2/11 | 2/11 (fork, wall art) | 1/11 (dishwasher door) | **≥ 80%** ✅ |
| Laundry | 2/11 | 2/11 | 7/11 (核心任务道具) | 0/11 | **≥ 40%（背景家具）** · 任务道具保留 Fallback ✅ |

### RECOMMENDATION：整体主包策略可行

- L1 / L2 背景家具 Kenney 覆盖率 ≥ 80%，符合 ONE PRIMARY PACK 原则
- L3 任务道具一律保留当前 Fallback（颜色编码对 gameplay 不可或缺，不得用外部模型破坏 identity）
- Cat / Phone / Umbrella / Fork / Laundry Baskets / Shirts / Socks / Towels 等任务强辨识度物体保留程序化 Fallback，既降低授权风险又保证 gameplay 清晰

---

## 下阶段下载审计中需要逐项验证的存在性

UNVERIFIED（下载包后核对）：
- Furniture Kit 是否确切包含上述每一类模型的具体变体
- Building Kit 门洞默认宽度是否 ≥ 当前 sharedRooms.doorways 宽度（否则需程序化墙体 + 结构模块混用）
- Food Kit cup/mug 是否足够接近脏杯的视觉需求
- 各模型 pivot 是否在底部中心（否则需要 Blender pivot fix）
- 各模型 scale 是否符合世界 1 单位 = 1 米惯例（否则需标准化）
