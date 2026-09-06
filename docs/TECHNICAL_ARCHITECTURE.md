# Word Maize — Technical Architecture

Status: authoritative engineering reference for the current MVP

## Stack

- Expo 57 and React Native 0.86
- React 19 and Expo Router
- TypeScript
- React Native Gesture Handler and Reanimated
- AsyncStorage for local persistence
- Expo Audio and Expo Haptics
- RevenueCat for purchases and AdMob for rewarded ads in development and production builds
- Vitest for deterministic game-rule tests

The app targets iOS, Android, and the web preview. Real purchase and ad SDKs require `expo-dev-client`; Expo Go and web use safe development fallbacks.

## Module boundaries

- `app/`: route entry points only.
- `src/screens/`: screen composition and navigation.
- `src/components/`: reusable native UI, cob renderer, overlays, modals, and controls.
- `src/game/`: deterministic rules for board exposure, cylinder wrapping, selection, harvesting, scoring, corn mechanics, obstacles, weather, validation, economy, and Endless generation.
- `src/data/`: authored levels, dictionary data, and shop offers.
- `src/store/`: save schema, migration, persistence, and state-changing actions.
- `src/monetization/`: native adapters and non-native fallbacks.
- `src/audio/`: music and sound ownership plus browser-safe audio unlock.
- `assets/word-maize/`: statically registered artwork and audio.
- `tools/art/`: reproducible corn-variant generation and validation.

Screens consume `src/game` APIs instead of duplicating rules. Generated images are presentation assets and never carry gameplay state.

## Board model

A Level contains rows, columns, and kernel records. A position can have multiple layers. Exposure is the first unharvested layer. Cylindrical adjacency wraps the first and last columns. Rotation determines which columns render and supplies the normalized side distance used by the 2.5D transform.

`CornCob` renders the approved cob composition, kernel and socket sprites, native letters, state marks, obstacles, selection, and harvest-flight animation. The same geometry handles every corn variety; registries only swap compatible art.

## Input and submission

`useCobRotation` owns drag/button rotation and snapping. `useKernelTapSelection` owns ordered tapping and backtracking. Submission is evaluated against the bundled dictionary. Variety, weather, obstacle, score, animation, audio, and persistence effects are then applied in a fixed order using deterministic helpers.

## Persistence

The save key is `word-maize.save.v1`; schema version is 5. `migrateSave` merges backward-compatible defaults instead of clearing older progress.

Persisted domains include coins, energy timestamp, tools, current campaign level, per-level stars and bests, settings, daily streak, story/tutorial flags, restoration claims, ad-free status, the active level snapshot, and Endless Harvest state.

An active snapshot records harvested IDs, found words, earned run coins, tools used, obstacle states, accepted turns, cracked Flint IDs, and Popcorn charges. Endless state records best stage plus active seed, stage, and start time. Generated stage IDs begin at 10001, outside campaign IDs.

## Endless generation

`src/game/endless.ts` hashes the saved seed into a reproducible pseudorandom stream. It chooses a validated same-variety campaign template, clones it, resets transient states, assigns a stage goal and reward, prefixes obstacle IDs, and deterministically shuffles. It does not create unconstrained random boards, so authored word structure remains available.

## Art contract

The approved Sweet kernel and socket define the permanent canvas, alpha footprint, center, light direction, and fit. Variant scripts preserve that contract. Perspective is computed at runtime; separate angle sprites are prohibited. Letters, highlights, mechanic badges, and accessibility remain native layers.

Run `npm run art:corn` to regenerate and validate variants, or `npm run art:corn:validate` to validate only.

## Monetization boundaries

Product identifiers, RevenueCat keys, and AdMob IDs are configured through `app.json` extras and EAS secrets. The economy has no backend and is not tamper-resistant. That is acceptable for the offline MVP but must be revisited before competitive or server-valued rewards.

## Quality gates

Before gameplay changes are complete:

```bash
npm run typecheck
npm test
npm run art:corn:validate
```

Also smoke-test compact iPhone layout, browser layout, rotation, resume, completion, map progression, every mechanic introduction, Reduced Motion, and the Level 60 to Endless unlock.

## Known post-MVP work

- Device testing for real purchases and rewarded ads
- Store receipt and restoration QA
- Push-notification implementation; the setting currently persists preference only
- Cloud saves and accounts
- Analytics and remote balancing
- Endless failure rules, leaderboards, daily competitive seeds, and live events
- Localization and broader accessibility audits
