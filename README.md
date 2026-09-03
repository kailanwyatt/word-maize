# Word Maize

Portrait Expo/React Native word game: trace adjacent kernels on a rotating 2.5D corn cob, harvest the cob, and work through Sweet Corn Fields.

## Run it

Gameplay UI runs in Expo Go. **In-app purchases and AdMob require a development build.**

```bash
npm install
npm start
```

That opens Expo Go. Use `npm run ios` / `npm run android` for a simulator, or `npm run web` in a browser.

### Development build (IAP + ads)

Expo Go cannot load RevenueCat or AdMob. Use a development client for real purchases and rewarded ads.

1. Create an [EAS](https://docs.expo.dev/eas/) project and fill `extra.eas.projectId` in `app.json`.
2. Add RevenueCat iOS/Android API keys to `expo.extra.revenueCatIosKey` / `revenueCatAndroidKey`.
3. Replace the Google test AdMob app IDs in the top-level `react-native-google-mobile-ads` block with your real app IDs before production.
4. Create App Store Connect / Play products matching:
   - `wordmaize_ad_free`
   - `wordmaize_starter_shed`
   - `wordmaize_farmers_toolbox`
   - `wordmaize_master_harvester`
5. Link those products in RevenueCat under entitlement `ad_free` (non-consumable) and the three consumable bundles.
6. Build and install a dev client:

```bash
npx eas build --profile development --platform ios
npm run start:dev
```

In `__DEV__`, if the store or ads SDK is missing, purchases and rewarded ads grant locally so you can still test the Farm Store and reward buttons.

## Verify it

```bash
npm run typecheck
npm test
```

## Controls

- Press a kernel and drag through adjacent letters (8-way, including cob wrap).
- Release to submit. Invalid words shake off; valid words harvest.
- Swipe empty cob space to rotate.
- Scarecrow / Butter Brush / Corn Picker sit on the tool belt. The lightbulb is a Scarecrow shortcut.
- Shuffle (↻) reshuffles remaining letters once per attempt.

## Architecture

- `src/game` — cylindrical board, selection, harvest, energy, scoring
- `src/store` — local AsyncStorage progress
- `src/monetization` — RevenueCat + rewarded AdMob wrappers
- `app/` — Expo Router screens (Map / Play / Shop)
