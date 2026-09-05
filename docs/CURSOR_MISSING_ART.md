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

None recorded. Add new requests below this line without deleting resolved history; mark completed requests as **Resolved** and reference the supplied asset path.

### MW-001 — Selected / hinted / invalid kernel treatments

- **Screen and state:** Gameplay cob. Selected kernels, Butter Brush / Scarecrow hints, and rejected/invalid submissions.
- **Proposed filename and destination:** `assets/word-maize/kernels/kernel-selected.png`, `kernel-hint.png`, `kernel-invalid.png` (final consistent set; older yellow variants exist but do not match `corn/asset-set-v1/kernel-full.png`).
- **Required dimensions / aspect:** Same footprint as `corn/asset-set-v1/kernel-full.png` (~1:1, 2x/3x). Alpha required.
- **Composition:** Glossy golden kernel. Selected = one strong white-green outline/glow, letter area left clean. Hint = softer gold glow, not a second letter color. Invalid = brief warm fault on the kernel body only.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Same full-kernel PNG with a tinted glow overlay; invalid uses `tintColor` and currently also recolors the letter.

### MW-002 — Cob body backing (no background leak)

- **Screen and state:** Gameplay cob, especially harvested / empty sockets and near-edge columns.
- **Proposed filename and destination:** `assets/word-maize/corn/cob-body.png` (or a seamless cob-core strip that tiles behind the kernel grid).
- **Required dimensions / aspect:** Portrait cob silhouette matching the 7-row board, roughly 2:3. Opaque interior, alpha only on outer husk edges if needed.
- **Composition:** Warm cob pith, no holes. Empty sockets must sit in this solid body so the farm background never shows through.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Socket PNG only (`corn/asset-set-v1/kernel-empty-socket.png`). Husks and `cob-core.png` are unused.

### MW-003 — Basket fill states

- **Screen and state:** Gameplay harvest meter at 0%, mid-level, and complete.
- **Proposed filename and destination:** `assets/word-maize/props/harvest-basket-empty.png`, `harvest-basket-partial.png`, `harvest-basket-full.png`
- **Required dimensions / aspect:** ~3:2, 2x/3x. Alpha required.
- **Composition:** Same basket silhouette across states. Empty = deep interior. Partial = visible kernels. Full = heaped kernels, no baked percentages.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Single `harvest-basket-v2.png` at every fill level.

### MW-004 — Harvest particles

- **Screen and state:** Valid word accepted; kernels fly from cob to basket.
- **Proposed filename and destination:** `assets/word-maize/effects/harvest-particle.png` (plus optional streak)
- **Required dimensions / aspect:** Small square sparkle/kernel chip, alpha required.
- **Composition:** Warm gold kernel crumbs / butter sparkles. No letters.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Kernel itself scales/rotates toward a hardcoded cob-corner target; `kernel-pop.png` and `sparkle-burst.png` are unused in the fly path.

### MW-005 — Pause and shuffle controls

- **Screen and state:** Gameplay HUD pause (opens pause modal) and shuffle.
- **Proposed filename and destination:** `assets/word-maize/ui/btn-pause.png`, `btn-shuffle.png`
- **Required dimensions / aspect:** 1:1, 88–132px at 3x. Alpha preferred over JPG.
- **Composition:** Wooden square/circle matching `btn_rotate.jpg` lighting. Pause = bars. Shuffle = cob/letter swap. No baked labels.
- **Screenshot:** `docs/captures/after/gameplay-iphone-se.png`
- **Temporary fallback:** Pause uses `btn_home.jpg`. Shuffle is a Unicode ↻ on a wood circle.

### MW-006 — Map nodes and star states

- **Screen and state:** All four chapter maps — current, complete (1/2/3 stars), locked.
- **Proposed filename and destination:** `assets/word-maize/ui/map-node-current.png`, `map-node-complete.png`, `map-node-locked.png`, `map-stars-1.png`, `map-stars-2.png`, `map-stars-3.png`
- **Required dimensions / aspect:** Node ~1:1 (~180px at 3x). Stars a wide strip or three separate marks. Alpha required.
- **Composition:** Follow each map’s painted road. Locked = solid icon, not emoji. Numbers remain native text.
- **Screenshot:** `docs/captures/after/map-sweet-corn-iphone-se.png`
- **Temporary fallback:** CSS green/grey circles, 🔒 emoji, Unicode ★.

### MW-007 — Character and mascot poses

- **Screen and state:** Level intro / story, completion celebration, Farm/Home idle.
- **Proposed filename and destination:** `assets/word-maize/characters/patch-idle.png`, `patch-speaking.png`, `patch-pointing.png`, `patch-worried.png`, `patch-celebrating.png`; `farmer-may-welcome.png`, `farmer-may-celebration.png`; `assets/word-maize/props/tractor-idle.png`, `tractor-celebration.png`
- **Required dimensions / aspect:** Portraits ~4:5, tractor ~4:3, 2x/3x, alpha required.
- **Composition:** Same lighting as Patch speaking v1. No baked dialogue.
- **Screenshot:** `docs/captures/baseline/gameplay-intro-iphone-se.png`, `docs/captures/after/farm-home-iphone-se.png`
- **Temporary fallback:** Only `patch-speaking-v1.png` and one tractor (`tractor-mascot-v2.png`) reused everywhere, including Farm/Home.

### MW-008 — Completion frame, stars, confetti

- **Screen and state:** Level-complete bumper crop modal.
- **Proposed filename and destination:** `assets/word-maize/ui/complete-frame.png`, `star-empty.png`, `star-filled.png`, `confetti.png`
- **Required dimensions / aspect:** Frame ~3:4 modal. Stars 1:1. Confetti overlay with alpha.
- **Composition:** Wood/cream frame. Stars arrive as separate marks (native timing). No baked coin amounts or level numbers.
- **Screenshot:** `docs/captures/after/pause-iphone-se.png` (modal chrome reference until a completion capture exists)
- **Temporary fallback:** CSS bumper panel, Unicode ★/☆, static `sparkle-burst.png`.

### MW-009 — Story, objective, shop, and daily cards

- **Screen and state:** Level intro, shop product/tool detail, Daily Harvest cells.
- **Proposed filename and destination:** `assets/word-maize/ui/card-story.png`, `card-objective.png`, `card-shop.png`, `card-daily.png`
- **Required dimensions / aspect:** ~4:3 or 16:10 slices with 24px 9-slice padding. Alpha or opaque wood.
- **Composition:** Warm wood + cream parchment. Leave interior empty for native text.
- **Screenshot:** `docs/captures/after/daily-harvest-iphone-se.png`, `docs/captures/after/settings-iphone-se.png`
- **Temporary fallback:** Rounded CSS cream/wood panels on farm/barn backgrounds.

### MW-010 — Tab icons, HUD chrome, store kit

- **Screen and state:** Farm / Play / Shop tabs; app icon, adaptive icon, splash, store feature graphic.
- **Proposed filename and destination:** `assets/word-maize/ui/tab-farm.png`, `tab-play.png`, `tab-shop.png`; `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png`, `assets/word-maize/ui/store-feature.png`
- **Required dimensions / aspect:** Tabs 1:1 ~96px at 3x, alpha. Icon 1024. Splash portrait 9:16. Feature 1024×500 or current store spec.
- **Composition:** Match logo-v2 lighting. Do not bake “FARM/PLAY/SHOP” into tab art; captions stay native.
- **Screenshot:** `docs/captures/after/farm-home-iphone-se.png`
- **Temporary fallback:** CSS house/shop drawings, cob PNG in the Play tab, default Expo icon/splash.

### MW-011 — Chapter One farm landmarks

- **Screen and state:** Farm/Home restored vs unrestored Chapter One landmarks.
- **Proposed filename and destination:** `assets/word-maize/props/landmark-barn-unrestored.png`, `landmark-barn-restored.png` (plus tractor/house variants as needed)
- **Required dimensions / aspect:** Overlay pieces with alpha, sized to `home-farm.png`.
- **Composition:** Same camera as `home-farm.png`. Unrestored = quiet/worn. Restored = repaired, no baked UI.
- **Screenshot:** `docs/captures/after/farm-home-iphone-se.png`
- **Temporary fallback:** Static `home-farm.png` only; one tractor PNG placed in the field.
