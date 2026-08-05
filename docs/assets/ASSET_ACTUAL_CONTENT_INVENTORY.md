# Asset Actual Content Inventory

Document ID: ASSET_ACTUAL_CONTENT_INVENTORY
Date: 2026-08-03
Scope: Kenney three-pack raw extracted contents (FACT, not inference)
Status: U N T R A C K E D

---

## 0. Inventory Counts Per Pack

Counts are `find unpacked/<pack> -type f | wc -l`, and format-type greps over that tree.

| Count category | furniture-kit | building-kit | food-kit |
|----------------|---------------|--------------|----------|
| Advertised (zip -l minus header rows) | 1559 | 418 | 1020 |
| Actual files extracted | 1546 | 407 | 1009 |
| FBX | 140 | 79 | 200 |
| OBJ | 140 | 79 | 200 |
| MTL (material for OBJ) | 140 | 79 | 200 |
| **GLB** (binary glTF) | **140** | **79** | **200** |
| glTF (JSON + separate bin) | 0 | 0 | 0 |
| DAE (Collada) | 140 | 0 | 0 |
| STL (3D-print) | 140 | 0 | 0 |
| PNG | 702 (includes ~700 render previews) | 86 (atlas + 85 preview PNGs) | 204 (1 atlas + 203 preview PNGs in Previews/) |
| JPG/JPEG | 0 | 0 | 0 |
| WEBP/TGA/BMP | 0 | 0 | 0 |
| README / LICENSE / docs | 1 License.txt + 3 .url | 1 License.txt + 3 .url + 1 Overview.html | 1 License.txt + 3 .url + 1 Overview.html |
| Animation clips files (_anim / Anim subdir) | 0 | 0 | 0 |

---

## 1. File Cross-Format Stability (per-pack per-model)

All three packs use a stable `<stem>` naming scheme:

```
FBX    = Models/FBX format/<stem>.fbx
OBJ    = Models/OBJ format/<stem>.obj  +  <stem>.mtl
GLB    = Models/(GLB format | GLTF format)/<stem>.glb
DAE    = Models/DAE format/<stem>.dae  (furniture only)
STL    = Models/STL format/<stem>.stl  (furniture only)
```

- furniture-kit's folder for GLB is literally named `Models/GLTF format/` (legacy misnomer), but 140/140 files inside are actually `.glb`. This has been verified by listing and should NOT be treated as glTF-JSON assets.
- building-kit / food-kit correct: `Models/GLB format/*.glb`

---

## 2. Furniture Kit (140 unique model stems)

List of stems (complete; OBJ directory listing sorted):

```
  1  bathroomCabinet              41 doorway                      81 loungeDesignSofa
  2  bathroomCabinetDrawer        42 doorwayFront                 82 loungeDesignSofaCorner
  3  bathroomMirror               43 doorwayOpen                  83 loungeSofa
  4  bathroomSink                 44 dryer                        84 loungeSofaCorner
  5  bathroomSinkSquare           45 floorCorner                  85 loungeSofaLong
  6  bathtub                      46 floorCornerRound             86 loungeSofaOttoman
  7  bear                         47 floorFull                    87 paneling
  8  bedBunk                      48 floorHalf                    88 pillow
  9  bedDouble                    49 hoodLarge                    89 pillowBlue
 10  bedSingle                    50 hoodModern                   90 pillowBlueLong
 11  bench                        51 kitchenBar                   91 pillowLong
 12  benchCushion                 52 kitchenBarEnd                92 plantSmall1
 13  benchCushionLow              53 kitchenBlender               93 plantSmall2
 14  bookcaseClosed               54 kitchenCabinet               94 plantSmall3
 15  bookcaseClosedDoors          55 kitchenCabinetCornerInner    95 pottedPlant
 16  bookcaseClosedWide           56 kitchenCabinetCornerRound    96 radio
 17  bookcaseOpen                 57 kitchenCabinetDrawer         97 rugDoormat
 18  bookcaseOpenLow              58 kitchenCabinetUpper          98 rugRectangle
 19  books                        59 kitchenCabinetUpperCorner    99 rugRound
 20  cabinetBed                   60 kitchenCabinetUpperDouble   100 rugRounded
 21  cabinetBedDrawer             61 kitchenCabinetUpperLow      101 rugSquare
 22  cabinetBedDrawerTable        62 kitchenCoffeeMachine        102 shower
 23  cabinetTelevision            63 kitchenFridge               103 showerRound
 24  cabinetTelevisionDoors       64 kitchenFridgeBuiltIn        104 sideTable
 25  cardboardBoxClosed           65 kitchenFridgeLarge          105 sideTableDrawers
 26  cardboardBoxOpen             66 kitchenFridgeSmall          106 speaker
 27  ceilingFan                   67 kitchenMicrowave            107 speakerSmall
 28  chair                        68 kitchenSink                 108 stairs
 29  chairCushion                 69 kitchenStove                109 stairsCorner
 30  chairDesk                    70 kitchenStoveElectric        110 stairsOpen
 31  chairModernCushion           71 lampRoundFloor              111 stairsOpenSingle
 32  chairModernFrameCushion      72 lampRoundTable              112 stoolBar
 33  chairRounded                 73 lampSquareCeiling           113 stoolBarSquare
 34  coatRack                     74 lampSquareFloor             114 table
 35  coatRackStanding             75 lampSquareTable             115 tableCloth
 36  computerKeyboard             76 lampWall                    116 tableCoffee
 37  computerMouse                77 laptop                      117 tableCoffeeGlass
 38  computerScreen               78 loungeChair                 118 tableCoffeeGlassSquare
 39  desk                         79 loungeChairRelax            119 tableCoffeeSquare
 40  deskCorner                   80 loungeDesignChair           120 tableCross
                                                                 121 tableCrossCloth
                                                                 122 tableGlass
                                                                 123 tableRound
                                                                 124 televisionAntenna
                                                                 125 televisionModern
                                                                 126 televisionVintage
                                                                 127 toaster
                                                                 128 toilet
                                                                 129 toiletSquare
                                                                 130 trashcan
                                                                 131 wall
                                                                 132 wallCorner
                                                                 133 wallCornerRond
                                                                 134 wallDoorway
                                                                 135 wallDoorwayWide
                                                                 136 wallHalf
                                                                 137 wallWindow
                                                                 138 wallWindowSlide
                                                                 139 washer
                                                                 140 washerDryerStacked
```

### Furniture Atlas / Material Strategy (FACT)
Furniture Kit (2018) ships **NO model textures** (Textures/ directory under each format is empty). Materials are SOLID COLOR via the OBJ MTL `Kd` line. Representative MTLs inspected:

- bedDouble.mtl → `carpetWhite (0.97,1,1)`, `wood (0.90,0.60,0.39)`, `metal (0.74,0.82,0.84)`, `carpet (0.94,0.37,0.34)` — zero `map_Kd` lines.
- loungeSofa.mtl → `carpet (red Kd) + wood` — zero map lines.
- tableCoffee.mtl → single `wood Kd` — zero map lines.

All 702 PNGs = render sprites (Isometric/ + Side/ dirs) — NOT atlas references for geometry. Each MTL uses named solid colors only.

---

## 3. Building Kit (79 unique model stems)

Sorted list:

```
barricade-doorway-a/b/c
barricade-window-a/b/c
border / border-corner / border-corner-diagonal / border-corner-round / border-corner-small
border-high (+ corner ×4 variants)
column / column-thin / column-wide
detail-pipe
door-rotate-round-a/b/c/d
door-rotate-square-a/b/c/d
floor / floor-corner-diagonal / floor-corner-round / floor-half / floor-quarter
gutter-vertical / -bottom / -short / -top / -wall
plating / plating-detailed / plating-detailed-wide / plating-wide
roof-flat-center / corner / corner-inner / patch / patch-large / side / square
stairs-center / -short
stairs-closed / -short
stairs-open / -short
stairs-sides / -short
wall
wall-corner / wall-corner-column / -column-bottom / -column-small / -column-small-bottom / -diagonal / -round
wall-doorway-round / -square / -wide-round / -wide-square
wall-half / wall-low
wall-window-round / -round-detailed / -square / -square-detailed / -wide-round / -wide-round-detailed / -wide-square / -wide-square-detailed
```

### Building Atlas / Material Strategy

Single shared atlas: `Models/Textures/variation-a.png` → **512 × 512** RGB.

All 79 modules reference this one atlas. Material count per module = 1-3, atlas resolution for the whole pack = 512².

---

## 4. Food Kit (200 unique model stems)

Representative slice; sorted search-relevant stems:

- Cup/mug family: mug, cup, cup-coffee, cup-tea, cup-saucer, ice-cream-cup
- Plate family: plate, plate-dinner, plate-deep, plate-rectangle, plate-sauerkraut, plate-broken
- Bowl family: bowl, bowl-broth, bowl-cereal, bowl-soup
- Utensils: utensil-fork, utensil-knife, utensil-spoon, cooking-fork, cooking-knife, cooking-spatula, cooking-spoon
- Bottle/can/carton family: bottle-ketchup, bottle-mustard, bottle-oil, soda-bottle, carton, carton-small, can, can-small, can-open, soda-can, soda-can-crushed
- Tray-like: cutting-board, cutting-board-round, cutting-board-japanese, styrofoam-dinner, styrofoam
- Pan: frying-pan, frying-pan-lid, pan, pan-stew, pot, pot-lid, pot-stew, pot-stew-lid
- Etc. 140 more food items.

### Food Atlas / Material Strategy

Single shared atlas `colormap.png`. Copied three times (one per format directory). All 200 props share this colormap.

---

## 5. "Do the packs actually ship GLB?" — Verdict

Earlier research hedged ("likely GLB", "probably OBJ/FBX only"). FACT now:

| Pack | Ships GLB | Ships glTF JSON | Ship count | Notes |
|------|-----------|-----------------|------------|-------|
| furniture-kit | YES | NO (all GLB binary) | 140 | in `Models/GLTF format/*.glb` (misnamed dir) |
| building-kit  | YES | NO | 79 | in `Models/GLB format/*.glb` |
| food-kit      | YES | NO | 200 | in `Models/GLB format/*.glb` |

The three packs therefore already ship GLB natively. The §12 Sofa/Coffee-Table/Bed GLB conversion drill is now understood to be a **validation exercise** (rebuild GLB from FBX in our own toolchain to confirm no licensing/format gotchas), not a strict prerequisite — because Kenney already provides GLB binaries with the exact same model set.

---

## 6. Atlas Cross-Pack Sharing / Multi-Mat

- Shared atlas across packs? NO. Furniture = solid color only; Building = 512 variation-a; Food = colormap. Three unrelated schemes.
- Atlas transparency? Building variation-a unknown alpha in this audit (not opened). MTL OBJ references it as map_Kd so assume opaque/alpha-cutout mix typical for Kenney packs.
- Multiple material versions per model? Furniture = yes (multi-solid MTLs). Building/Food = single atlas material per model.
- Standalone models or full scenes? ALL standalone (1 model per file, no scenes).
- Model naming stability? YES — camelCase furniture, kebab-case building/food, consistent across formats, no suffix versions.

---

## 7. Missing Expected Files (or surprises)

- furniture-kit: no ceiling mesh; wall/wallDoorway/wallWindow are present but do NOT have the Building Kit's parametric length (they are full 2.0m panels but no explicit shared length guarantee with Building kit — use Building kit walls instead).
- building-kit: no ceiling module. No interior doorframe (only doorway with wall integrated). Doors are independent separate rotate modules. This is a strength.
- food-kit: no dedicated tray — use cutting-board or styrofoam-dinner. No dedicated detergent bottle — `carton` or `can-small` are proxies.

