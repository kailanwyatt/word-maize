# Audio and service readiness

## Audio map

- The app intentionally has no music or ambient loops.
- Sound effects cover kernel selection/backtracking, accepted and rejected words, cob rotation, basket harvest, coins, tools, cleared obstacles, rain, wind, storms, rewards, and level completion.
- The Sound Effects switch controls all feedback. App backgrounding suspends audio. Background playback and recording remain disabled.

The included effects are original lightweight MVP cues. They can be replaced file-for-file by mastered sound-design assets without changing gameplay code.

## Legal links

- Privacy Policy: https://wordmaize.com/privacy-policy
- Terms of Use: https://wordmaize.com/terms-of-use

Links appear in Settings and the Farm Store. Confirm both pages are published and contain the final company, advertising, purchases, children/privacy, and support language before store submission.

## Placeholder services

The integrations are wired but external dashboards still require owner credentials:

1. Create the iOS and Android apps in RevenueCat, configure the `ad_free` entitlement and products matching the IDs in `src/data/shop.ts`, then provide platform API keys through app config/EAS secrets.
2. Create the iOS and Android AdMob apps and rewarded units, then replace all Google sample app IDs and rewarded-unit IDs. Production treats sample rewarded IDs as unconfigured.
3. Set the EAS project ID and make an Expo development build. Expo Go cannot load these native services.
4. Test purchases, restore, cancellation, offline failure, ad completion, and closing an ad before reward on sandbox/test accounts.

`enableDevelopmentStoreGrants` permits simulated purchases and rewards only when the JavaScript bundle is a development build. Release bundles never grant placeholder purchases or ad rewards.
