# Word Maize MVP execution roadmap

Status: historical execution plan. See `README.md` and `TECHNICAL_ARCHITECTURE.md` for the current build.

## Definition of MVP complete

The MVP is a polished, installable portrait mobile game with one complete ten-level chapter, persistent progression, replayable levels, story/tutorial moments, working tools, energy, coins, daily rewards, shop presentation, rewarded ads, purchases, settings, audio/haptics, recovery from interrupted sessions, and store-ready visual assets.

## Ownership split

### Codex

- Deterministic game rules and automated validation
- Save versioning, migrations, and local persistence
- Objectives, stars, rewards, unlocking, economy, and inventory
- Level/session lifecycle and interruption recovery
- Navigation, accessibility, settings behavior, and reduced motion
- RevenueCat and AdMob wiring/configuration
- Unit/integration tests and release checks
- Performance diagnostics and production build configuration
- Final raster artwork, asset variants, and visual reference sheets

### Cursor

- Integration and organization of final artwork supplied by ChatGPT/Codex
- Cob/kernel/socket visual integration using approved assets
- Screen-by-screen responsive visual polish
- Code integration of supplied character, map, completion, tool, shop, daily, icon, and splash artwork
- Animation timing and visual effects, without changing game rules
- Physical-device visual QA across supported sizes
- Missing-art documentation for Codex; Cursor does not generate, redraw, retouch, or replace artwork

## Remaining production sequence

1. Foundation hardening: versioned saves, migrations, session recovery, error-safe startup.
2. Complete Chapter One loop: enter, play, complete/fail, reward, unlock, return, replay.
3. Economy: energy spending/replenishment, coins, tool inventory, first-time rewards.
4. Supporting UX: Farm, Map, Shop, Daily Harvest, Settings, How to Play, pause and confirmations.
5. Platform systems: audio, reduced motion, privacy/terms, analytics-ready event boundary.
6. Monetization: RevenueCat products/restoration and rewarded AdMob placements in a development build.
7. Art integration using `CURSOR_MVP_HANDOFF.md`.
8. Device QA: layout, gestures, interruptions, persistence, offline behavior, memory and frame pacing.
9. Store preparation: icons, splash, screenshots, descriptions, privacy disclosures, TestFlight/internal testing.

## Release gates

- Every level can be completed without payment.
- No reward can be granted twice through reopening or rapid tapping.
- Progress survives restart and save-schema upgrades.
- Ads and purchases fail safely when offline or unavailable.
- Development controls are absent from production builds.
- `npm test`, `npm run typecheck`, native development builds, and the ten-level manual smoke test pass.
