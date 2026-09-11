import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { mazeAssets } from '../../assets/word-maize/maze/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { DialogCopy, FarmDialog } from '../components/FarmDialog';
import { MazeFarmerPicker } from '../components/maze/MazeFarmerPicker';
import { RaisedBoard } from '../components/RaisedBoard';
import { editFarmerName, FARMER_NAME_MAX, sanitizeFarmerName } from '../data/mazeFarmers';
import { LOCALES, useMessages } from '../i18n';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../monetization/config';
import { restorePurchases } from '../monetization/purchases';
import { useGameStore } from '../store/GameStore';

const SWITCH_TRACK = { false: '#d9ceba', true: '#58c22e' };

export function SettingsScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const t = useMessages();
  const { save, setSetting, setAdFree, resetProgress } = useGameStore();
  const [resetOpen, setResetOpen] = useState(false);
  const nameRef = useRef<TextInput>(null);
  const restore = async () => {
    const result = await restorePurchases();
    if (result.adFree) setAdFree(true);
    Alert.alert('Restore', result.message);
  };
  const cycleLanguage = () => {
    if (LOCALES.length < 2) return;
    const index = LOCALES.indexOf(save.settings.language);
    setSetting('language', LOCALES[(index + 1) % LOCALES.length]);
  };
  const confirmReset = () => {
    resetProgress();
    setResetOpen(false);
    router.replace('/(tabs)/play');
  };
  const portrait = mazeAssets.farmerProfiles[save.settings.mazeFarmer];

  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CurrencyBar onSettings={embedded ? undefined : () => router.push('/(tabs)/profile')} />
        <ScrollView contentContainerStyle={[styles.scroll, embedded && styles.scrollTab]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <RaisedBoard wood radius={16} depth={4} wrapStyle={styles.signWrap} style={styles.signFace}>
            <Text style={styles.signTitle}>{embedded ? t.settings.profileTitle : t.settings.title}</Text>
          </RaisedBoard>

          <View style={styles.sheet}>
            <Text style={styles.sheetSub}>{t.settings.profileSub}</Text>

            <View style={styles.hero}>
              <View style={styles.avatarRing}>
                <Image source={portrait} resizeMode="contain" style={styles.avatar} />
              </View>
              <View style={styles.nameCol}>
                <Text style={styles.nameLabel}>{t.settings.farmerName}</Text>
                <View style={styles.nameField}>
                  <TextInput
                    ref={nameRef}
                    accessibilityLabel={t.settings.farmerName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={FARMER_NAME_MAX}
                    placeholder={t.settings.namePlaceholder}
                    placeholderTextColor="#8a7350"
                    value={save.settings.farmerName}
                    onChangeText={value => setSetting('farmerName', editFarmerName(value))}
                    onBlur={() => setSetting('farmerName', sanitizeFarmerName(save.settings.farmerName))}
                    style={styles.nameInput}
                  />
                  <Pressable accessibilityRole="button" accessibilityLabel={t.settings.farmerName} onPress={() => nameRef.current?.focus()} style={styles.pencilHit}>
                    <PencilMark />
                  </Pressable>
                </View>
              </View>
            </View>

            <Text style={styles.chooseLabel}>{t.settings.chooseFarmer}</Text>
            <MazeFarmerPicker value={save.settings.mazeFarmer} onChange={id => setSetting('mazeFarmer', id)} />

            <View style={styles.sectionHead}>
              <GearGlyph />
              <Text style={styles.sectionTitle}>{t.settings.gameSettings}</Text>
            </View>
            {([
              ['sfx', t.settings.sfx, 'sound'],
              ['music', t.settings.music, 'music'],
              ['haptics', t.settings.haptics, 'haptics'],
              ['notifications', t.settings.notifications, 'bell'],
              ['reducedMotion', t.settings.reducedMotion, 'motion'],
              ['skipStory', t.settings.skipStory, 'skip'],
            ] as const).map(([key, label, glyph]) => (
              <View key={key} style={styles.row}>
                <SettingGlyph kind={glyph} />
                <Text style={styles.rowLabel}>{label}</Text>
                <Switch
                  accessibilityLabel={label}
                  value={save.settings[key]}
                  onValueChange={value => setSetting(key, value)}
                  trackColor={SWITCH_TRACK}
                  thumbColor="#ffffff"
                  ios_backgroundColor={SWITCH_TRACK.false}
                />
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.settings.language}
              disabled={LOCALES.length < 2}
              onPress={cycleLanguage}
              style={styles.row}
            >
              <SettingGlyph kind="globe" />
              <Text style={styles.rowLabel}>{t.settings.language}</Text>
              <Text style={styles.langValue}>{t.meta.languageName}</Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
            {__DEV__ ? (
              <>
                <View style={styles.row}>
                  <SettingGlyph kind="dev" />
                  <Text style={styles.rowLabel}>{t.settings.unlockAll}</Text>
                  <Switch
                    accessibilityLabel={t.settings.unlockAll}
                    value={save.settings.devUnlock}
                    onValueChange={value => setSetting('devUnlock', value)}
                    trackColor={SWITCH_TRACK}
                    thumbColor="#ffffff"
                    ios_backgroundColor={SWITCH_TRACK.false}
                  />
                </View>
                <Text style={styles.devHint}>{t.settings.devHint}</Text>
              </>
            ) : null}

            <View style={styles.sectionHead}>
              <CloudGlyph />
              <Text style={styles.sectionTitle}>{t.settings.progressData}</Text>
            </View>
            <View style={styles.actionRow}>
              <CreamAction label={t.settings.restorePurchases} onPress={restore} icon="restore" />
              <CreamAction label={t.settings.reset} onPress={() => setResetOpen(true)} icon="reset" />
            </View>
            <CreamAction label={t.settings.howToPlay} onPress={() => router.push('/how-to-play')} wide />

            <View style={styles.legalRow}>
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.legalHit}>
                <Text style={styles.legalLink}>{t.settings.privacy}</Text>
              </Pressable>
              <View style={styles.legalRule} />
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(TERMS_URL)} style={styles.legalHit}>
                <Text style={styles.legalLink}>{t.settings.terms}</Text>
              </Pressable>
            </View>
            {embedded ? null : (
              <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backHit}>
                <Text style={styles.legalLink}>{t.common.back}</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <FarmDialog
        visible={resetOpen}
        title={t.reset.title}
        onClose={() => setResetOpen(false)}
        primary={{ label: t.reset.confirm, onPress: confirmReset, tone: 'gold' }}
        actions={[{ label: t.common.cancel, onPress: () => setResetOpen(false), tone: 'slate' }]}
      >
        <DialogCopy>{t.reset.body}</DialogCopy>
        <DialogCopy>{t.reset.keep}</DialogCopy>
      </FarmDialog>
    </ImageBackground>
  );
}

function CreamAction({
  label, onPress, icon, wide,
}: {
  label: string;
  onPress: () => void;
  icon?: 'restore' | 'reset';
  wide?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.actionBtn, wide && styles.actionWide]}>
      {icon === 'restore' ? <RestoreGlyph /> : icon === 'reset' ? <ResetGlyph /> : null}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function PencilMark() {
  return (
    <View style={styles.pencil}>
      <View style={styles.pencilBody} />
      <View style={styles.pencilTip} />
    </View>
  );
}

function GearGlyph() {
  return (
    <View style={styles.sectionGlyph}>
      <View style={styles.gearHub} />
      <View style={[styles.gearTooth, { transform: [{ rotate: '0deg' }] }]} />
      <View style={[styles.gearTooth, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.gearTooth, { transform: [{ rotate: '90deg' }] }]} />
      <View style={[styles.gearTooth, { transform: [{ rotate: '135deg' }] }]} />
    </View>
  );
}

function CloudGlyph() {
  return (
    <View style={styles.sectionGlyph}>
      <View style={styles.cloud} />
    </View>
  );
}

function SettingGlyph({ kind }: { kind: 'sound' | 'music' | 'haptics' | 'bell' | 'motion' | 'skip' | 'globe' | 'dev' }) {
  const mark = {
    sound: '♪',
    music: '♫',
    haptics: '◎',
    bell: '!',
    motion: '›',
    skip: '▶',
    globe: '○',
    dev: '+',
  }[kind];
  return (
    <View style={styles.rowGlyph}>
      <Text style={styles.rowGlyphText}>{mark}</Text>
    </View>
  );
}

function RestoreGlyph() {
  return <Text style={styles.actionGlyph}>↑</Text>;
}

function ResetGlyph() {
  return <Text style={styles.actionGlyph}>↻</Text>;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#1a3a18' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 28, gap: 10 },
  scrollTab: { paddingBottom: 48 },
  signWrap: { alignSelf: 'center', minWidth: 248, maxWidth: 340 },
  signFace: { paddingHorizontal: 22, paddingVertical: 10, alignItems: 'center' },
  signTitle: { color: '#fff6c6', fontWeight: '900', fontSize: 22, letterSpacing: 0.4, textShadowColor: '#1d1408', textShadowRadius: 4, textAlign: 'center' },
  sheet: {
    borderRadius: 22,
    backgroundColor: 'rgba(255, 248, 228, 0.97)',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sheetSub: { color: '#8a6a3a', fontWeight: '700', fontSize: 12, textAlign: 'center', marginBottom: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#c9a15a',
    backgroundColor: '#f3e6c8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatar: { width: 96, height: 96, marginBottom: -6 },
  nameCol: { flex: 1, minWidth: 0 },
  nameLabel: { color: '#6a4420', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  nameField: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2c48a',
    backgroundColor: '#fffdf6',
    paddingLeft: 12,
    paddingRight: 4,
  },
  nameInput: { flex: 1, fontWeight: '800', fontSize: 16, color: '#3b2410', paddingVertical: 8 },
  pencilHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pencil: { width: 14, height: 14, transform: [{ rotate: '-45deg' }] },
  pencilBody: { position: 'absolute', left: 4, top: 0, width: 6, height: 11, borderRadius: 1, backgroundColor: '#8a6a3a' },
  pencilTip: { position: 'absolute', left: 4, bottom: 0, width: 0, height: 0, borderLeftWidth: 3, borderRightWidth: 3, borderTopWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#c45a12' },
  chooseLabel: { color: '#6a4420', fontWeight: '800', fontSize: 13, marginBottom: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 4 },
  sectionTitle: { color: '#3d2a14', fontWeight: '900', fontSize: 16 },
  sectionGlyph: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  gearHub: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6a4420' },
  gearTooth: { position: 'absolute', width: 4, height: 16, borderRadius: 1, backgroundColor: '#6a4420' },
  cloud: { width: 16, height: 10, borderRadius: 8, backgroundColor: '#6a4420' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 10, borderBottomWidth: 1, borderBottomColor: '#ead9a7' },
  rowGlyph: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3e6c8', alignItems: 'center', justifyContent: 'center' },
  rowGlyphText: { color: '#6a4420', fontWeight: '900', fontSize: 13 },
  rowLabel: { flex: 1, color: '#3d2a14', fontWeight: '800', fontSize: 15 },
  langValue: { color: '#6a4420', fontWeight: '800', fontSize: 14 },
  chevron: { color: '#8a6a3a', fontWeight: '900', fontSize: 14, marginLeft: 4 },
  devHint: { color: '#7a5828', fontSize: 12, fontWeight: '700', lineHeight: 16, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2c48a',
    backgroundColor: '#fffdf6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  actionWide: { flex: 0, width: '100%', marginTop: 8, flexDirection: 'row', gap: 8 },
  actionLabel: { color: '#3d2a14', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  actionGlyph: { color: '#6a4420', fontWeight: '900', fontSize: 16 },
  legalRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 },
  legalHit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  legalLink: { color: '#6a4420', fontWeight: '800', textDecorationLine: 'underline' },
  legalRule: { width: 1, height: 16, backgroundColor: '#c9a15a' },
  backHit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
