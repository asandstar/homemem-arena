# Asset License Verification

Document ID: ASSET_LICENSE_VERIFICATION
Date: 2026-08-03
Scope: Kenney furniture-kit / building-kit / food-kit
Status: U N T R A C K E D (do not commit)

---

## 0. Result Summary

| Pack | License page tag | Bundled License.txt | Commercial use | Modification | Redistribution | Attribution | Final status |
|------|------------------|---------------------|----------------|--------------|----------------|-------------|--------------|
| furniture-kit 2.0 (2018) | Creative Commons CC0 ✓ | Creative Commons Zero, CC0 1.0 | YES | YES | YES | NOT REQUIRED | **LICENSE_CONFIRMED** |
| building-kit 1.0 (2025) | Creative Commons CC0 ✓ | Creative Commons Zero, CC0 1.0 | YES | YES | YES | NOT REQUIRED | **LICENSE_CONFIRMED** |
| food-kit 2.0 (2024) | Creative Commons CC0 ✓ | Creative Commons Zero, CC0 1.0 | YES | YES | YES | NOT REQUIRED | **LICENSE_CONFIRMED** |

No LICENSE_CONFLICT, no LICENSE_UNVERIFIED packs this round. All three fall into the strongest category (LICENSE_CONFIRMED; bundled text present and consistent with page tag).

---

## 1. Per-Pack SOURCE.md Facts

### 1.1 furniture-kit
- Pack name: Furniture Kit (2.0)
- Author: Kenney (kenney.nl)
- Official asset page: https://kenney.nl/assets/furniture-kit
- Direct download source: in-browser Kenney donate dialog → continue-without-donating → browser-download → user-assisted copy to raw
- License: Creative Commons Zero 1.0 Universal (CC0)
- Commercial use: explicitly allowed ("free to use in personal, educational and commercial projects" — License.txt)
- Modification allowed: YES (CC0 grants all rights)
- Redistribution: YES (CC0)
- Attribution requirement: explicitly NOT mandatory ("Support us by crediting Kenney … this is not mandatory")
- Checked date: 2026-08-03

### 1.2 building-kit
- Pack name: Building Kit (1.0)
- Author: Kenney
- Official asset page: https://kenney.nl/assets/building-kit
- Direct download source: same in-browser flow
- License: Creative Commons Zero 1.0 Universal (CC0)
- Commercial use: YES ("…personal, educational, and commercial purposes")
- Modification allowed: YES
- Redistribution: YES
- Attribution requirement: NOT a requirement
- Checked date: 2026-08-03

### 1.3 food-kit
- Pack name: Food Kit (2.0)
- Author: Kenney
- Official asset page: https://kenney.nl/assets/food-kit
- Direct download source: same in-browser flow
- License: Creative Commons Zero 1.0 Universal (CC0)
- Commercial use: YES
- Modification allowed: YES
- Redistribution: YES
- Attribution requirement: NOT a requirement
- Checked date: 2026-08-03

---

## 2. Bundle Contents License Text Audit

Each pack was checked for:
- License.txt
- README
- CC0 declaration
- Author info

| Expected bundled file | furniture | building | food |
|-----------------------|-----------|----------|------|
| License.txt present?  | YES       | YES      | YES  |
| CC0 declaration present inside License.txt | YES | YES | YES |
| Author attribution (Kenney + www.kenney.nl) inside bundle | YES | YES | YES |
| README present (any)  | NO (Instructions.url + License.txt + preview only) | NO (Overview.html + License.url only) | NO |
| Separate COPYING / CREDITS / NOTICE / CC0.txt | NO | NO | NO |

No conflict between page-declared license and bundled license text. All three statuses = **LICENSE_CONFIRMED** (not "WITH_MISSING_BUNDLED_TEXT", because License.txt is present verbatim with CC0 + author).

---

## 3. Audit-Directory License Archive Inventory

Per §5 four files produced outside the repo at `$AUDIT_DIR/licenses/<pack-id>/`:

| File | Purpose |
|------|---------|
| SOURCE.md | Pack name / author / page URL / download source / six license rights / checked date |
| LICENSE.txt | Bytewise copy of the bundled Kenney License.txt |
| CHECKSUMS.txt | SHA-256 of the raw zip (copy of manifests/<pack-id>.manifest.sha256) |
| ARCHIVE_CONTENTS.txt | `unzip -l` output of the full archive |

Status of these four per pack:

| Pack | SOURCE.md | LICENSE.txt (bundled copy) | CHECKSUMS.txt | ARCHIVE_CONTENTS.txt |
|------|-----------|---------------------------|---------------|----------------------|
| furniture | ✓ | ✓ | ✓ | ✓ |
| building  | ✓ | ✓ | ✓ | ✓ |
| food      | ✓ | ✓ | ✓ | ✓ |

Note: the files were produced during §4/§5 processing on-disk in the audit directory; this markdown is the in-repo summary of that on-disk state.

---

## 4. Conflicting-License Contingency

No packs raised conflicts. Rejected-source check from §3 was also enforced:
- NOT from Poly Pizza re-pack
- NOT from GitHub non-official mirror
- NOT from网盘 / search-cache / 3rd party repost
- Source = official kenney.nl asset page → official donate-continue download flow

---

## 5. Right-To-Use Decision for HOMEMEM ARENA

Decision: all three packs are approved for use in HOMEMEM ARENA production.

- CC0 1.0 Universal covers the entire pack contents (3D meshes, renders, previews)
- Attribution is not required, but should be placed in a credits screen for community support (optional, not a legal requirement)
- No royalties, no copyleft, no share-alike clauses
- Fully compatible with closed-source and commercial distribution

