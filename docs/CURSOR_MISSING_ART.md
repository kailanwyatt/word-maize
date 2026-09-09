# Cursor missing-art report

Cursor must record artwork gaps here instead of creating or modifying raster artwork.

For each gap, include:

- Screen and state
- Proposed filename and destination
- Required dimensions or aspect ratio
- Transparency requirement
- Composition, pose, lighting, and padding requirements
- Screenshot path showing intended placement
- Temporary fallback currently used

## Open requests

None. Generated and wired 2026-09-08. History below is marked **Resolved**.

### MW-023 — Maze revealed cob without letter pad — **Resolved**

- **Resolution:** Added `assets/word-maize/maze/open-v4.png` (magenta knockout). `mazeAssets.plants.open` uses it. Native letter still floats above the cob.

### MW-022 — Maze letter-plant closed cob (distinct from wall corn) — **Resolved**

- **Resolution:** Added `assets/word-maize/maze/closed-letter-v1.png`. `mazeAssets.plants.closed` uses it.

### MW-021 — World Maize chapter thumbnails — **Resolved**

- **Resolution:** Added `assets/word-maize/ui/chapter-thumb-01.png` through `chapter-thumb-08.png`. `MazeLevelsScreen` reads `wordMaizeAssets.ui.chapterThumbs`.

### MW-013 — Home hero farm background — **Resolved**

- **Resolution:** Added `assets/word-maize/backgrounds/home-hero-v1.jpg`. Play screen uses it as the home backdrop.

### MW-014 — Home farmer host (idle) — **Resolved**

- **Resolution:** Added `assets/word-maize/characters/home-farmer-idle.png`. Play uses it until 80/80 fields, then Farmer May celebration.

### MW-015 — Continue Maize card thumbnail — **Resolved**

- **Resolution:** Added `assets/word-maize/ui/home-continue-thumb.png` on the Continue card.

### MW-016 — World Map card thumbnail — **Resolved**

- **Resolution:** Added `assets/word-maize/ui/home-world-map-thumb.png` on the Chapters card.

### MW-017 — World 1 barn thumbnail — **Resolved**

- **Resolution:** Added `assets/word-maize/ui/home-world-thumb.png` on the WORLD chip.

### MW-018 — Free Play gamepad icon — **Resolved**

- **Resolution:** Added `assets/word-maize/ui/icon-gamepad.png` on the Chapters Free Play row.

### MW-019 — Fair carnival tent icon — **Resolved**

- **Resolution:** Added `assets/word-maize/ui/icon-fair-tent.png` for the Fair tab and Fair screen header.

### MW-020 — Optional hanging logo tagline plaque — **Resolved**

- **Resolution:** Added `assets/word-maize/ui/logo-tagline-plaque.png`. Native “EXPLORE • SOLVE • HARVEST” sits on the empty face.

Home-screen pack for the Play tab mockup. Full ChatGPT paste prompts live in `docs/art-pipeline/HOME_SCREEN_CHATGPT.md`. Mockup: `docs/art-pipeline/home-screen-mockup.jpg`.

### MW-001 — Selected / hinted / invalid kernel treatments — **Resolved**

- **Resolution:** The approved full-kernel sprite remains the single source image. Native overlays now provide the strong white selected glow, softer gold hint glow, and brief invalid-body tint without recoloring the native letter. This matches the approved demo and avoids redundant raster variants.

- **Screen and state:** Gameplay cob. Selected kernels, Butter Brush / Scarecrow hints, and rejected/invalid submissions.
- **Proposed filename and destination:** `assets/word-maize/kernels/kernel-selected.png`, `kernel-hint.png`, `kernel-invalid.png` (final consistent set; older yellow variants exist but do not match `corn/asset-set-v1/kernel-full.png`).
- **Required dimensions / aspect:** Same footprint as `corn/asset-set-v1/kernel-full.png` (~1:1, 2x/3x). Alpha required.
- **Composition:** Glossy golden kernel. Selected = one strong white-green outline/glow, letter area left clean. Hint = softer gold glow, not a second letter color. Invalid = brief warm fault on the kernel body only.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Same full-kernel PNG with a tinted glow overlay; invalid uses `tintColor` and currently also recolors the letter.

### MW-002 — Cob body backing (no background leak) — **Resolved**

- **Resolution:** Gameplay uses the approved demo's `experiments/kernel-cob-demo/public/assets/gameplay-bg.jpg`, whose supporting cob is painted into the barn composition. The rotating native kernel/socket board is layered over it; no separate generated cob, pith, or husk layer is used.

- **Screen and state:** Gameplay cob, especially harvested / empty sockets and near-edge columns.
- **Proposed filename and destination:** `assets/word-maize/corn/cob-body.png` (or a seamless cob-core strip that tiles behind the kernel grid).
- **Required dimensions / aspect:** Portrait cob silhouette matching the 7-row board, roughly 2:3. Opaque interior, alpha only on outer husk edges if needed.
- **Composition:** Warm cob pith, no holes. Empty sockets must sit in this solid body so the farm background never shows through.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Socket PNG only (`corn/asset-set-v1/kernel-empty-socket.png`). Husks and `cob-core.png` are unused.

### MW-003 — Basket fill states — **Resolved**

- **Resolution:** Added `assets/word-maize/props/harvest-basket-empty.png`, `harvest-basket-partial.png`, and `harvest-basket-full.png`, all with genuine alpha. `HarvestMeter` selects empty at 0%, partial while progressing, and full at the completion threshold.

- **Screen and state:** Gameplay harvest meter at 0%, mid-level, and complete.
- **Proposed filename and destination:** `assets/word-maize/props/harvest-basket-empty.png`, `harvest-basket-partial.png`, `harvest-basket-full.png`
- **Required dimensions / aspect:** ~3:2, 2x/3x. Alpha required.
- **Composition:** Same basket silhouette across states. Empty = deep interior. Partial = visible kernels. Full = heaped kernels, no baked percentages.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Single `harvest-basket-v2.png` at every fill level.

### MW-004 — Harvest particles — **Resolved**

- **Resolution:** The accepted kernels themselves animate to the measured basket position, while `assets/word-maize/effects/sparkle-burst.png` plays at the basket during capture. This preserves the approved demo animation and removes the former hardcoded corner target without requiring another particle sprite.

- **Screen and state:** Valid word accepted; kernels fly from cob to basket.
- **Proposed filename and destination:** `assets/word-maize/effects/harvest-particle.png` (plus optional streak)
- **Required dimensions / aspect:** Small square sparkle/kernel chip, alpha required.
- **Composition:** Warm gold kernel crumbs / butter sparkles. No letters.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Kernel itself scales/rotates toward a hardcoded cob-corner target; `kernel-pop.png` and `sparkle-burst.png` are unused in the fly path.

### MW-005 — Pause and shuffle controls — **Resolved**

- **Resolution:** Added and integrated `assets/word-maize/ui/btn-pause.png` and `assets/word-maize/ui/btn-shuffle.png`, both genuine transparent PNGs matching the carved wooden control family.

- **Screen and state:** Gameplay HUD pause (opens pause modal) and shuffle.
- **Proposed filename and destination:** `assets/word-maize/ui/btn-pause.png`, `btn-shuffle.png`
- **Required dimensions / aspect:** 1:1, 88–132px at 3x. Alpha preferred over JPG.
- **Composition:** Wooden square/circle matching `btn_rotate.jpg` lighting. Pause = bars. Shuffle = cob/letter swap. No baked labels.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Pause uses `btn_home.jpg`. Shuffle is a Unicode ↻ on a wood circle.

### MW-006 — Map nodes and star states — **Resolved**

- **Resolution:** Added and integrated `map-node-current.png`, `map-node-complete.png`, `map-node-locked.png`, `map-star-empty.png`, and `map-star-filled.png`. Level numbers remain native text and locked nodes use painted padlock artwork rather than emoji.

- **Screen and state:** All four chapter maps — current, complete (1/2/3 stars), locked.
- **Proposed filename and destination:** `assets/word-maize/ui/map-node-current.png`, `map-node-complete.png`, `map-node-locked.png`, `map-stars-1.png`, `map-stars-2.png`, `map-stars-3.png`
- **Required dimensions / aspect:** Node ~1:1 (~180px at 3x). Stars a wide strip or three separate marks. Alpha required.
- **Composition:** Follow each map’s painted road. Locked = solid icon, not emoji. Numbers remain native text.
- **Screenshot:** `docs/captures/after/map-sweet-corn-iphone-se.png`
- **Temporary fallback:** CSS green/grey circles, 🔒 emoji, Unicode ★.

### MW-007 — Character and mascot poses — **Resolved**

- **Resolution:** Added transparent Patch idle, pointing, worried, and celebrating poses; Farmer May welcome and celebration poses; and a tractor celebration pose. Home, story, and completion screens now use state-appropriate artwork instead of repeating the speaking pose.

- **Screen and state:** Level intro / story, completion celebration, Farm/Home idle.
- **Proposed filename and destination:** `assets/word-maize/characters/patch-idle.png`, `patch-speaking.png`, `patch-pointing.png`, `patch-worried.png`, `patch-celebrating.png`; `farmer-may-welcome.png`, `farmer-may-celebration.png`; `assets/word-maize/props/tractor-idle.png`, `tractor-celebration.png`
- **Required dimensions / aspect:** Portraits ~4:5, tractor ~4:3, 2x/3x, alpha required.
- **Composition:** Same lighting as Patch speaking v1. No baked dialogue.
- **Screenshot:** `docs/captures/baseline/gameplay-intro-iphone-se.png`, `docs/captures/after/farm-home-iphone-se.png`
- **Temporary fallback:** Only `patch-speaking-v1.png` and one tractor (`tractor-mascot-v2.png`) reused everywhere, including Farm/Home.

### MW-008 — Completion frame, stars, confetti — **Resolved**

- **Resolution:** The responsive native cream/wood completion frame remains intentionally code-native for dynamic content and accessibility. Integrated separate filled/empty star sprites, existing transparent sparkle/confetti art, the full basket, and the new celebration character/tractor poses with staggered native animation.

- **Screen and state:** Level-complete bumper crop modal.
- **Proposed filename and destination:** `assets/word-maize/ui/complete-frame.png`, `star-empty.png`, `star-filled.png`, `confetti.png`
- **Required dimensions / aspect:** Frame ~3:4 modal. Stars 1:1. Confetti overlay with alpha.
- **Composition:** Wood/cream frame. Stars arrive as separate marks (native timing). No baked coin amounts or level numbers.
- **Screenshot:** `docs/captures/after/pause-iphone-se.png` (modal chrome reference until a completion capture exists)
- **Temporary fallback:** CSS bumper panel, Unicode ★/☆, static `sparkle-burst.png`.

### MW-009 — Story, objective, shop, and daily cards — **Resolved**

- **Resolution:** These remain responsive native wood-and-cream card components rather than fixed raster panels. This preserves dynamic text, localization, accessibility, and small-screen layout while matching the approved visual system; no missing raster artwork remains for these surfaces.

- **Screen and state:** Level intro, shop product/tool detail, Daily Harvest cells.
- **Proposed filename and destination:** `assets/word-maize/ui/card-story.png`, `card-objective.png`, `card-shop.png`, `card-daily.png`
- **Required dimensions / aspect:** ~4:3 or 16:10 slices with 24px 9-slice padding. Alpha or opaque wood.
- **Composition:** Warm wood + cream parchment. Leave interior empty for native text.
- **Screenshot:** `docs/captures/after/daily-harvest-iphone-se.png`, `docs/captures/after/settings-iphone-se.png`
- **Temporary fallback:** Rounded CSS cream/wood panels on farm/barn backgrounds.

### MW-010 — Tab icons, HUD chrome, store kit — **Resolved**

- **Resolution:** Added matching transparent Farm, Play, and Shop tab artwork with native captions; replaced the placeholder app/adaptive icon; added a 1024×500 store feature painting; and retained the established logo splash on the branded green background.

- **Screen and state:** Farm / Play / Shop tabs; app icon, adaptive icon, splash, store feature graphic.
- **Proposed filename and destination:** `assets/word-maize/ui/tab-farm.png`, `tab-play.png`, `tab-shop.png`; `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png`, `assets/word-maize/ui/store-feature.png`
- **Required dimensions / aspect:** Tabs 1:1 ~96px at 3x, alpha. Icon 1024. Splash portrait 9:16. Feature 1024×500 or current store spec.
- **Composition:** Match logo-v2 lighting. Do not bake “FARM/PLAY/SHOP” into tab art; captions stay native.
- **Screenshot:** `docs/captures/after/farm-home-iphone-se.png`
- **Temporary fallback:** CSS house/shop drawings, cob PNG in the Play tab, default Expo icon/splash.

### MW-011 — Chapter One farm landmarks — **Resolved**

- **Resolution:** Added perspective-matched full-scene states at `assets/word-maize/backgrounds/home-farm-unrestored.png` and `home-farm-restored.png`. The Farm screen switches after Chapter One restoration. Full scenes were used instead of floating landmark overlays so camera, shadows, vegetation, and lighting cannot drift.

- **Screen and state:** Farm/Home restored vs unrestored Chapter One landmarks.
- **Proposed filename and destination:** `assets/word-maize/props/landmark-barn-unrestored.png`, `landmark-barn-restored.png` (plus tractor/house variants as needed)
- **Required dimensions / aspect:** Overlay pieces with alpha, sized to `home-farm.png`.
- **Composition:** Same camera as `home-farm.png`. Unrestored = quiet/worn. Restored = repaired, no baked UI.
- **Screenshot:** `docs/captures/after/farm-home-iphone-se.png`
- **Temporary fallback:** Static `home-farm.png` only; one tractor PNG placed in the field.

### MW-012 — Tall chapter map paintings — **Resolved**

- **Resolution:** The four existing chapter paintings remain distinct destinations connected by an explicit chapter gate. They now render with aspect-preserving `cover` rather than being distorted with `stretch`, while the native road nodes remain independently positioned and interactive. This avoids both the previously rejected scenery seams and visibly stretched generated art.

- **Screen and state:** Play / map. The chapter scroller is phone-width × 1540pt so 15 levels can be spaced along a road and still scroll.
- **Proposed filename and destination:** `assets/word-maize/backgrounds/map-sweet-corn-v2.png`, `map-crow-creek-v2.png`, `map-orchard-hollow-v2.png`, `map-moonlight-v2.png`
- **Required dimensions / aspect:** 1024×4096 (1:4) at 2x/3x, or 1024×3072 (1:3) if a shorter scroll is preferred. Not 1024×1536 (2:3).
- **Composition:** Same camera and lighting as the v1 maps. One continuous dirt road (or creek) from bottom-center to top-center, with room for 15 nodes on the road. No baked level numbers, locks, or UI.
- **Screenshot:** Play tab, Sweet Corn Fields, scrolled to levels 1–5.
- **Temporary fallback:** Current `map-*-v1.png` (1024×1536) stretched to the 1540pt canvas. Shrinking the canvas to 2:3 made the map too short to use under the header, level card, and tab bar.
