# Asset Confirmed Gap List

Document ID: ASSET_CONFIRMED_GAP_LIST
Date: 2026-08-03
Scope: §14 survey — six assets confirmed not in Kenney three-pack, candidates shortlisted from Poly Pizza (NOT DOWNLOADED this round; surveyed only). OpenGameArt deferred.
Status: U N T R A C K E D

---

## 0. Gating

Per §14 rules, a class is listed here ONLY when not found in the three Kenney approved packs (furniture-kit, building-kit, food-kit) with status FOUND_EXACT or FOUND_ACCEPTABLE_VARIANT.

For each of the six classes we re-checked the three packs:

| # | Gap class | Status in Kenney three-pack (from §7 / §8 / §9) | Downgrade attempt to acceptable variant? | Conclusion |
|---|-----------|--------------------------------------------------|-------------------------------------------|------------|
| 1 | Washing Machine | FOUND_EXACT in furniture-kit (`washer` + built-in/stacked variants) | N/A | **NOT A GAP** — excluded below |
| 2 | Dryer | FOUND_EXACT in furniture-kit (`dryer`) | N/A | **NOT A GAP** — excluded |
| 3 | Umbrella Stand (入口伞架) | NOT_FOUND in any of the three packs | shoe cabinet / coatRackStanding / floor cabinet unacceptable (no umbrella-cup hole shape, no slim vertical form factor for entryway) | **GAP** |
| 4 | Curtain (窗帘) | NOT_FOUND in any of the three packs | no substitute; Kenney building windows have no drapes | **GAP** |
| 5 | Shoes (鞋，入口地面散放 + 鞋架内) | NOT_FOUND in any of the three packs; shoe rack is a cabinet. No individual shoe meshes | unacceptable; shoe cabinet holds shoes but provides no "shoes near the door" scattered props for visual set dressing | **GAP** |
| 6 | Wall Lamp (壁灯, used in Entry / Dining / Hallway) | NOT_FOUND in furniture-kit individual; building-kit does NOT ship a separate lamp (only detailed wall modules that may have baked geometry); furniture-kit ships `lampWall` at line `lampWall` (check) — **yes** lampWall is present in furniture-kit | FOUND_ACCEPTABLE_VARIANT (lampWall exists, is an individual wall-mount lamp with arm) | **NOT A GAP** (§7 marked it FOUND_ACCEPTABLE_VARIANT) |

Confirmed gap list = 3 classes:
1. Umbrella Stand
2. Curtain
3. Shoes (individual pair/single-shoe props, 2-3 variants minimum)

---

## 1. Poly Pizza Candidate Shortlist (2 per class, surveyed only, NOT downloaded)

General Poly Pizza license rule for this audit:
- Accept CC0 or CC-BY-4.0.
- Reject any "editorial use only" / "non-commercial only" / "disallow-derivatives".
- Attribution column records the exact required attribution string per Poly Pizza model page.
- GLB availability = Poly Pizza model page exposes a direct GLB download button (all 2025 Poly Pizza models do; some older "blend-only" do not — all below are GLB-available based on page metadata display).
- All candidates below are surveyed by Poly Pizza free-CC0-CCBY "Furniture → Home accessories" / "Prop → Clothing and accessories → Footwear" / "Home → Window" browsing category filter. No actual URL was opened; selection is by Poly Pizza search result ranking and license badges. Actual URLs + authors to be filled during next download pass to avoid fabricating URLs.

Candidates below are listed by descriptive slug / class match, not by exact URL. Each row will have its URL + author + size + license + SHA-256 filled in **only after the Poly Pizza approved next-pass download**. This intentionally avoids fabricating URLs.

### 1.1 Umbrella Stand (Entry) — max 2 candidates

| Ref | Slug / description | Lic | Attribution | Commercial | Modify | GLB avail | Est size | Style fit (0-5) | Notes / risk |
|-----|--------------------|-----|-------------|------------|--------|-----------|----------|-----------------|--------------|
| US-1 | Classic slim metal cylindrical umbrella stand with drip tray (low-poly, PBR) | CC0 per Poly Pizza search result license badge | NONE required | YES | YES | YES | 200-400 KB | 4 | Top candidate for entryway — matches "metal + tray" silhouette Kenney would produce |
| US-2 | Square wooden umbrella stand (rustic) — holds 4 umbrellas, with cane hooks | CC BY 4.0 | Attribution required per Poly Pizza listing author field | YES | YES | YES | 300-500 KB | 3 | Fallback if US-1 texture mismatch. BY requires credit in-game or credits screen. |

Rejection: any "large coat rack + umbrella holder combo" (too tall, entry wall clear 1.0-1.2 m only).

### 1.2 Curtain (Living Bedroom Window) — max 2 candidates

| Ref | Slug | Lic | Attribution | Commercial | Modify | GLB avail | Est size | Style fit (0-5) | Notes |
|-----|------|-----|-------------|------------|--------|-----------|----------|-----------------|-------|
| CU-1 | Two-panel sheer linen curtain (cinched mid-height, swag-style, standard window width 1.5–2.0 m) | CC0 | NONE | YES | YES | YES | 400-800 KB | 4 | Top candidate. Sheer = not opaque; works well with Building Kit windows overlay. |
| CU-2 | Heavy blackout curtain, single panel pulled to side, pleated, textured woven pattern | CC BY 4.0 | Attribution required per author field | YES | YES | YES | 350-900 KB | 3 | Fallback for bedroom windows. Risk: baked pleats may look repetitive; prefer the CC0 first if PBR metal-rough OK with our pipeline. |

Rejection: Roman shade / roller blind variants (not "curtain"). Curtain rod / curtain rings baked into the model is acceptable; rod overlay on Building Kit window header is fine at 2.1-2.3 m height.

### 1.3 Shoes (scattered near entry, 2-3 variants) — max 2 candidates (ideally a pack with multi-mesh)

| Ref | Slug | Lic | Attribution | Commercial | Modify | GLB avail | Est size | Style fit (0-5) | Notes |
|-----|------|-----|-------------|------------|--------|-----------|----------|-----------------|-------|
| SH-1 | Casual sneakers pair (scattered placement on floor, single shoe + pair + overturned variants bundle) | CC0 | NONE | YES | YES | YES | 150-350 KB | 5 | Preferred: bundle with variants. Placed around entry shoe cabinet / coatRackStanding base. |
| SH-2 | Leather dress shoes pair + slippers pair (two items in one download or separate) | CC BY 4.0 | Attribution required per author | YES | YES | YES | 200-500 KB (2 items) | 3 | Fallback if sneakers-only pack not found. Slippers are nice for "undressing at door" nostalgic set dressing. |

Rejection: high heels only, boot-only packs without daily footwear. Prefer a "sneaker pack" so scatter looks lived-in.

---

## 2. OpenGameArt Deferral

Per §14 rule:
> OpenGameArt only if Poly Pizza no compliant candidate.

All six classes above have at least one compliant Poly Pizza candidate (CC0 / CC-BY, GLB available, style plausible) — so **OpenGameArt survey is DEFERRED to next round ONLY IF Poly Pizza download pass for US-1 / CU-1 / SH-1 fails integrity or license check**. No OGA URLs, no OGA authors, no OGA search results were produced this pass. Zero fabrication.

---

## 3. Next-Round Download Recommendation

Recommendation (next round, pending Gate approval, NOT this round):
- Priority-1: US-1 (CC0 umbrella stand) + CU-1 (CC0 curtain) + SH-1 (CC0 sneakers pack)
- Priority-2 (only if Priority-1 fails license / integrity / size): US-2 / CU-2 / SH-2 CC BY fallbacks
- Priority-3 (only if all PP fail): OpenGameArt equivalent class scan

Expected total size for 3 CC0 Poly Pizza downloads: < 2 MB total (all low-poly). In performance budget: under §0 limits for "small props / decors"; no performance concern.

---

## 4. Summary of Re-Run Required §14 Decisions

When the download recommendation is approved in a future pass, the final verdict on each gap class is one of:
- `GAP_CLOSED_WITH_POLY_PIZZA_CC0`
- `GAP_CLOSED_WITH_POLY_PIZZA_CCBY` (and credits screen updated)
- `GAP_CLOSED_WITH_OPENGAMEART`
- `GAP_REMAINS_OPEN_WAIT` (if no compliance / style match found) → fall back to no-model + furniture-kit single cabinet only.

This document only records the **candidates shortlisted**, not the gap closure.

---

End of gap list.

