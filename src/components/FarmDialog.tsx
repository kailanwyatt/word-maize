import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type Action = { label: string; onPress: () => void; dim?: boolean; tone?: 'green' | 'gold' | 'slate' };

type Props = {
  visible: boolean;
  title: string;
  onClose?: () => void;
  children?: ReactNode;
  primary?: Action;
  actions?: Action[];
};

export function FarmDialog({ visible, title, onClose, children, primary, actions }: Props) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.shade}>
        <View style={[styles.card, { maxHeight: Math.min(height * 0.86, 640) }]}>
          <View style={styles.header}>
            <View style={styles.headerCap} />
            {onClose ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            ) : <View style={styles.closeSpacer} />}
            <BannerTitle>{title}</BannerTitle>
          </View>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
            {actions?.map(action => (
              <View key={action.label} style={styles.actionGap}>
                <FarmDialogButton {...action} />
              </View>
            ))}
            {primary ? <View style={styles.actionGap}><FarmDialogButton {...primary} /></View> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function FarmDialogButton({ label, onPress, dim, tone = 'green' }: Action) {
  const palette = tone === 'gold'
    ? { lip: '#c45a12', face: '#f08a1c', shine: '#ffd089', border: '#ffc56a' }
    : tone === 'slate'
      ? { lip: '#5c5348', face: '#8d8173', shine: '#cfc6b8', border: '#d9d0c4' }
      : { lip: '#2f7a16', face: '#58c22e', shine: '#b9f07a', border: '#8ee85a' };
  return (
    <Pressable accessibilityRole="button" disabled={dim} onPress={onPress} style={[styles.btnHit, dim && styles.dim]}>
      {({ pressed }) => (
        <View style={styles.btnWrap}>
          <View style={[styles.btnLip, { backgroundColor: palette.lip }]} />
          <View style={[styles.btnFace, { backgroundColor: palette.face, borderColor: palette.border, top: pressed ? 7 : 0 }]}>
            <View style={[styles.btnShine, { backgroundColor: palette.shine }]} />
            <BannerTitle size={18} shadow={false}>{label}</BannerTitle>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function DialogCopy({ children }: { children: ReactNode }) {
  return <Text style={styles.copy}>{children}</Text>;
}

export function BannerTitle({ children, size = 26, shadow = true }: { children: string; size?: number; shadow?: boolean }) {
  const label = children.toUpperCase();
  const stroke = [
    { x: -1.6, y: 0 }, { x: 1.6, y: 0 }, { x: 0, y: -1.4 }, { x: 0, y: 2.2 },
    { x: -1.2, y: 1.6 }, { x: 1.2, y: 1.6 },
  ];
  return (
    <View style={styles.titleWrap}>
      {stroke.map((offset, index) => (
        <Text key={index} pointerEvents="none" style={[styles.title, styles.titleStroke, { fontSize: size, transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}>{label}</Text>
      ))}
      <Text style={[styles.title, { fontSize: size, textShadowColor: shadow ? 'rgba(40,22,8,0.35)' : 'transparent', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { flex: 1, backgroundColor: 'rgba(8,18,14,0.72)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#4a2a12',
    backgroundColor: '#f7edd4',
    overflow: 'hidden',
    shadowColor: '#120804',
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    backgroundColor: '#e8d5b0',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#c9a56a',
  },
  headerCap: { position: 'absolute', left: 10, right: 10, top: 0, height: 10, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: 'rgba(255,255,255,0.28)' },
  close: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#efe3c8',
    borderWidth: 2,
    borderColor: '#b08950',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSpacer: { position: 'absolute', right: 10, top: 10, width: 34, height: 34 },
  closeX: { color: '#4a2a12', fontWeight: '900', fontSize: 16, marginTop: -1 },
  titleWrap: { alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fffdf6', fontWeight: '900', letterSpacing: 0.8, textAlign: 'center' },
  titleStroke: { position: 'absolute', color: '#3b2410' },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  copy: { color: '#5a3a22', fontWeight: '700', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  actionGap: { marginTop: 8 },
  btnHit: { alignSelf: 'stretch' },
  btnWrap: { height: 58, justifyContent: 'flex-end' },
  btnLip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 50, borderRadius: 28 },
  btnFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnShine: { position: 'absolute', left: 18, right: 18, top: 0, height: 16, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, opacity: 0.35 },
  dim: { opacity: 0.5 },
});
