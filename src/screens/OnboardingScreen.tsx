import { Image, ImageBackground, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { mazeAssets } from '../../assets/word-maize/maze/assets';
import { FarmButton, RaisedPill } from '../components/FarmButton';
import { MazeFarmerPicker } from '../components/maze/MazeFarmerPicker';
import { WoodPanel } from '../components/WoodPanel';
import { editFarmerName, FARMER_NAME_MAX, sanitizeFarmerName, type MazeFarmerId } from '../data/mazeFarmers';
import { farmerTalkName } from '../game/farmerCopy';
import { useMessages } from '../i18n';
import { useGameStore } from '../store/GameStore';

const PATCH = {
  speaking: wordMaizeAssets.characters.patchSpeaking,
  pointing: wordMaizeAssets.characters.patchPointing,
  celebrating: wordMaizeAssets.characters.patchCelebrating,
} as const;
const MAY = {
  speaking: wordMaizeAssets.characters.farmerMayWelcome,
  pointing: wordMaizeAssets.characters.farmerMayWelcome,
  celebrating: wordMaizeAssets.characters.farmerMayCelebration,
} as const;

type Pose = 'speaking' | 'pointing' | 'celebrating';
type HostId = 'patch' | 'may';

function hostFor(farmerId: MazeFarmerId): HostId {
  return farmerId === 'patch' ? 'may' : 'patch';
}

function hostPortrait(id: HostId, pose: Pose) {
  return id === 'may' ? MAY[pose] : PATCH[pose];
}

function farmerPortrait(id: MazeFarmerId): ImageSourcePropType {
  return mazeAssets.farmerProfiles[id];
}

export function OnboardingScreen() {
  const t = useMessages();
  const store = useGameStore();
  const [step, setStep] = useState(0);
  const farmerId = store.save.settings.mazeFarmer;
  const farmerName = store.save.settings.farmerName;
  const hostId = hostFor(farmerId);
  const pages = [
    { setup: true as const, title: t.onboarding.setupTitle, body: [t.onboarding.setupBody] },
    { role: 'farmer' as const, pose: 'speaking' as const, title: t.onboarding.welcomeTitle, body: [t.onboarding.welcomeBody] },
    { role: 'host' as const, pose: 'pointing' as const, title: t.onboarding.playTitle, body: [] as string[], ways: true },
    { role: 'farmer' as const, pose: 'speaking' as const, title: t.onboarding.coinsTitle, body: [t.onboarding.coinsBody], coins: true },
    { role: 'farmer' as const, pose: 'celebrating' as const, title: t.onboarding.readyTitle, body: [t.onboarding.readyBody] },
  ];
  const page = pages[step];
  const last = step === pages.length - 1;
  const advance = () => {
    store.setSetting('farmerName', sanitizeFarmerName(store.save.settings.farmerName));
    if (last) store.markOnboardingSeen();
    else setStep(step + 1);
  };
  const pose: Pose = 'pose' in page && page.pose ? page.pose : 'speaking';
  const farmerArt = farmerPortrait(farmerId);
  const hostArt = hostPortrait(hostId, pose);
  const farmerSpeaks = 'role' in page && page.role === 'farmer';
  const setup = 'setup' in page && page.setup;
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Image source={wordMaizeAssets.ui.logo} style={styles.logo} />
          <View style={styles.dots}>
            {pages.map((item, index) => (
              <View key={`${item.title}-${index}`} style={[styles.dot, index === step && styles.dotOn]} />
            ))}
          </View>
          {setup ? (
            <View style={styles.setup}>
              <WoodPanel style={styles.banner}>
                <Text style={styles.bannerLabel}>{t.onboarding.setupBanner}</Text>
              </WoodPanel>
              <View style={styles.setupBody}>
                <Text style={styles.setupTitle}>{page.title}</Text>
                {page.body.map(line => <Text key={line} style={styles.setupCopy}>{line}</Text>)}
                <MazeFarmerPicker value={farmerId} onChange={id => store.setSetting('mazeFarmer', id)} />
                <Text style={styles.nameLabel}>{t.onboarding.nameOptional}</Text>
                <View style={styles.nameField}>
                  <PersonMark />
                  <TextInput
                    accessibilityLabel={t.settings.farmerName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={FARMER_NAME_MAX}
                    placeholder={t.onboarding.namePlaceholder}
                    placeholderTextColor="#8a7350"
                    value={farmerName}
                    onChangeText={value => store.setSetting('farmerName', editFarmerName(value))}
                    style={styles.nameInput}
                  />
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={t.common.continue} onPress={advance} style={styles.continue}>
                  {({ pressed }) => <RaisedPill label={t.common.continue} pressed={pressed} />}
                </Pressable>
              </View>
            </View>
          ) : (
            <Talk
              side={farmerSpeaks ? 'left' : 'right'}
              name={farmerSpeaks ? farmerTalkName(farmerName, farmerId) : (hostId === 'may' ? t.onboarding.may : t.onboarding.patch)}
              portrait={farmerSpeaks ? farmerArt : hostArt}
              title={page.title}
              lines={page.body}
            >
              {'ways' in page && page.ways ? (
                <View style={styles.ways}>
                  <WayCard image={wordMaizeAssets.ui.onboardingMaize} label={t.onboarding.playMaizeLabel} body={t.onboarding.playMaize} />
                  <WayCard image={wordMaizeAssets.ui.onboardingFair} label={t.onboarding.playFairLabel} body={t.onboarding.playFair} />
                </View>
              ) : null}
              {'coins' in page && page.coins ? (
                <View style={styles.propRow}>
                  <Image source={wordMaizeAssets.ui.coin} style={styles.prop} />
                  <Image source={wordMaizeAssets.ui.energy} style={styles.prop} />
                  <Image source={wordMaizeAssets.powerups.scarecrow} style={styles.prop} />
                  <Image source={wordMaizeAssets.powerups.mower} style={styles.prop} />
                  <Image source={wordMaizeAssets.powerups.lantern} style={styles.prop} />
                </View>
              ) : null}
            </Talk>
          )}
          {setup ? null : <FarmButton label={last ? t.common.letsGrow : t.common.continue} onPress={advance} />}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function PersonMark() {
  return (
    <View style={styles.person} accessibilityElementsHidden importantForAccessibility="no">
      <View style={styles.personHead} />
      <View style={styles.personBody} />
    </View>
  );
}

function Talk({
  side, name, portrait, title, lines, children,
}: {
  side: 'left' | 'right';
  name: string;
  portrait: ImageSourcePropType;
  title: string;
  lines: readonly string[];
  children?: import('react').ReactNode;
}) {
  const right = side === 'right';
  return (
    <View style={[styles.talk, right && styles.talkRight]}>
      <Image source={portrait} style={styles.portrait} />
      <View style={[styles.bubbleWrap, right && styles.bubbleWrapRight]}>
        <View style={[styles.tail, right ? styles.tailRight : styles.tailLeft]} />
        <View style={[styles.bubble, right ? styles.rightBubble : styles.leftBubble]}>
          <Text style={styles.speaker}>{name}</Text>
          <Text style={styles.title}>{title}</Text>
          {lines.map(line => <Text key={line} style={styles.body}>{line}</Text>)}
          {children}
        </View>
      </View>
    </View>
  );
}

function WayCard({ image, label, body }: { image: ImageSourcePropType; label: string; body: string }) {
  return (
    <View style={styles.way}>
      <Image source={image} style={styles.wayArt} />
      <Text style={styles.wayLabel}>{label}</Text>
      <Text style={styles.wayBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#1a3a18' },
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 12, flexGrow: 1, justifyContent: 'center' },
  logo: { width: 188, height: 124, resizeMode: 'contain', alignSelf: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,246,198,0.35)' },
  dotOn: { backgroundColor: '#f0c43a' },
  setup: {
    backgroundColor: '#f6ead0',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#160b03',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
    elevation: 8,
  },
  banner: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2a1508',
  },
  bannerLabel: {
    color: '#fff4d0',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.6,
    textShadowColor: 'rgba(20,8,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  setupBody: { padding: 16, paddingTop: 14, gap: 10 },
  setupTitle: { color: '#3b2410', fontWeight: '900', fontSize: 26 },
  setupCopy: { color: '#6a5130', fontWeight: '700', fontSize: 14, lineHeight: 20 },
  nameLabel: { color: '#8a7350', fontWeight: '800', fontSize: 11, letterSpacing: 1.1, marginTop: 4 },
  nameField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#d4b896',
    borderRadius: 14,
    backgroundColor: '#fff8e8',
    paddingHorizontal: 12,
    minHeight: 46,
  },
  person: { width: 18, height: 18, alignItems: 'center' },
  personHead: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8a7350',
  },
  personBody: {
    width: 12,
    height: 8,
    marginTop: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#8a7350',
  },
  nameInput: {
    flex: 1,
    fontWeight: '800',
    color: '#3b2410',
    paddingVertical: 8,
  },
  continue: { width: '100%', marginTop: 6 },
  talk: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  talkRight: { flexDirection: 'row-reverse' },
  portrait: { width: 118, height: 168, resizeMode: 'contain', marginBottom: -6 },
  bubbleWrap: { flex: 1, paddingBottom: 10 },
  bubbleWrapRight: { alignItems: 'flex-end' },
  bubble: {
    borderRadius: 18,
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    width: '100%',
  },
  leftBubble: { backgroundColor: '#fff4d6', borderColor: '#8a5a18' },
  rightBubble: { backgroundColor: '#f6de7a', borderColor: '#c78a32' },
  tail: {
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    marginBottom: -10,
    borderWidth: 3,
  },
  tailLeft: { marginLeft: 18, backgroundColor: '#fff4d6', borderColor: '#8a5a18', borderRightWidth: 0, borderTopWidth: 0 },
  tailRight: { marginRight: 18, backgroundColor: '#f6de7a', borderColor: '#c78a32', borderLeftWidth: 0, borderTopWidth: 0 },
  speaker: { color: '#6a4420', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
  title: { color: '#406f20', fontWeight: '900', fontSize: 20 },
  body: { color: '#51351f', fontWeight: '700', fontSize: 15, lineHeight: 21 },
  ways: { gap: 8, marginTop: 4 },
  way: {
    backgroundColor: 'rgba(255,248,220,0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c78a32',
    overflow: 'hidden',
  },
  wayArt: { width: '100%', height: 92, resizeMode: 'cover' },
  wayLabel: { color: '#406f20', fontWeight: '900', fontSize: 14, paddingHorizontal: 8, paddingTop: 6 },
  wayBody: { color: '#51351f', fontWeight: '700', fontSize: 13, lineHeight: 18, paddingHorizontal: 8, paddingBottom: 8 },
  propRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 6 },
  prop: { width: 36, height: 36, resizeMode: 'contain' },
});
