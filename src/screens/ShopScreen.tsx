import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { FarmButton, Panel } from '../components/FarmButton';
import { SHOP_PRODUCTS, ShopProduct, TOOL_INFO } from '../data/shop';
import { ToolId } from '../game/types';
import { purchaseProduct } from '../monetization/purchases';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';

export function ShopScreen() {
  const router = useRouter();
  const store = useGameStore();
  const [detail, setDetail] = useState<ShopProduct | ToolId | undefined>();
  const [confirm, setConfirm] = useState<ShopProduct | undefined>();
  const [purchasing, setPurchasing] = useState(false);
  const [rewarding, setRewarding] = useState(false);
  const purchaseBusy = useRef(false);
  const buy = async (product: ShopProduct) => {
    if (purchaseBusy.current) return;
    purchaseBusy.current = true;
    setPurchasing(true);
    const result = await purchaseProduct(product);
    if (result.ok) {
      if (result.adFree) store.setAdFree(true);
      if (result.tools) store.addTools(result.tools);
      setConfirm(undefined);
      setDetail(undefined);
      Alert.alert('Harvest stored', result.message ?? 'Thanks, farmer.');
    } else {
      Alert.alert('Purchase', result.message ?? 'Could not complete that purchase.');
    }
    purchaseBusy.current = false;
    setPurchasing(false);
  };
  const productDetail = typeof detail === 'object' ? detail : undefined;
  const toolDetail = typeof detail === 'string' ? detail : undefined;
  const toolContents = (product: ShopProduct) => product.tools
    ? `${product.tools.scarecrow ?? 0} Scarecrows · ${product.tools.butterBrush ?? 0} Brushes · ${product.tools.cornPicker ?? 0} Pickers`
    : 'Permanent account upgrade';
  const watchForTool = async (tool: ToolId) => {
    if (rewarding) return;
    setRewarding(true);
    const result = await showRewardedAd('tool', store.save.adFree);
    if (result.rewarded) {
      store.addTools({ [tool]: 1 });
      Alert.alert('Tool earned', `1 ${TOOL_INFO[tool].title} was added to your tool belt.`);
    } else Alert.alert('Reward unavailable', result.message ?? 'The rewarded ad could not be shown.');
    setRewarding(false);
  };
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.shopBarn} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <View style={styles.titleBoard}>
          <Text style={styles.eyebrow}>FARMER MAY'S</Text>
          <Text style={styles.title}>Tool Shed</Text>
          <Text style={styles.subtitle}>Stock up before the next harvest</Text>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.featureCard}>
            <Image source={wordMaizeAssets.ui.storeFeature} style={styles.featureArt} />
            <View style={styles.featureShade} />
            <View style={styles.featureCopy}><Text style={styles.featureEyebrow}>FARMER MAY'S PICK</Text><Text style={styles.featureTitle}>Ready for stubborn cobs</Text><Text style={styles.featureText}>Tool packs work across every chapter.</Text></View>
          </View>
          {__DEV__ ? <View style={styles.devNotice}><Text style={styles.devNoticeText}>DEVELOPMENT PREVIEW · STORE PURCHASES GRANT TEST ITEMS</Text></View> : null}
          {SHOP_PRODUCTS.map(product => (
            <Pressable key={product.id} style={[styles.card, product.id === 'farmers_toolbox' && styles.featuredProduct]} onPress={() => setDetail(product)}>
              {product.id === 'farmers_toolbox' ? <View style={styles.valueRibbon}><Text style={styles.valueRibbonText}>BEST VALUE</Text></View> : null}
              <View style={styles.productArt}>
                {product.entitlement === 'ad_free' ? <Text style={styles.noAds}>ADS{`\n`}OFF</Text> : (
                  <View style={styles.bundleArt}>
                    <Image source={wordMaizeAssets.powerups.scarecrow} style={styles.bundleIcon} />
                    <Image source={wordMaizeAssets.powerups.butterBrush} style={styles.bundleIconMain} />
                    <Image source={wordMaizeAssets.powerups.cornPicker} style={styles.bundleIcon} />
                  </View>
                )}
              </View>
              <View style={styles.productCopy}>
                <Text style={styles.cardTitle}>{product.title}</Text>
                <Text style={styles.blurb}>{product.blurb}</Text>
                <Text style={styles.contents}>{toolContents(product)}</Text>
              </View>
              <View style={[styles.priceButton, product.entitlement === 'ad_free' && store.save.adFree && styles.ownedPrice]}><Text style={styles.price}>{product.entitlement === 'ad_free' && store.save.adFree ? 'OWNED' : product.displayPrice}</Text></View>
            </Pressable>
          ))}
          <View style={styles.sectionBoard}><Text style={styles.section}>YOUR TOOL BELT</Text></View>
          {(Object.keys(TOOL_INFO) as ToolId[]).map(tool => (
            <Pressable key={tool} style={styles.toolCard} onPress={() => setDetail(tool)}>
              <View style={styles.toolArt}><Image source={wordMaizeAssets.powerups[tool]} style={styles.tool} /></View>
              <View style={styles.productCopy}>
                <Text style={styles.cardTitle}>{TOOL_INFO[tool].title}</Text>
                <Text style={styles.blurb} numberOfLines={2}>{TOOL_INFO[tool].blurb}</Text>
              </View>
              <View style={styles.ownedBadge}><Text style={styles.ownedCount}>×{store.save.inventory[tool]}</Text><Text style={styles.ownedLabel}>OWNED</Text></View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
      <Modal visible={!!productDetail} transparent animationType="fade">
        <View style={styles.shade}>
          <Panel>
            <Text style={styles.modalTitle}>{productDetail?.title}</Text>
            <Text style={styles.body}>{productDetail?.blurb}</Text>
            <View style={{ height: 12 }} />
            <FarmButton label={`BUY ${productDetail?.displayPrice ?? ''}`} onPress={() => productDetail && setConfirm(productDetail)} dim={productDetail?.entitlement === 'ad_free' && store.save.adFree} />
            <View style={{ height: 10 }} />
            <FarmButton label="CLOSE" onPress={() => setDetail(undefined)} />
          </Panel>
        </View>
      </Modal>
      <Modal visible={!!toolDetail} transparent animationType="fade">
        <View style={styles.shade}>
          <Panel>
            <Text style={styles.modalTitle}>{toolDetail ? TOOL_INFO[toolDetail].title : ''}</Text>
            <Text style={styles.body}>{toolDetail ? TOOL_INFO[toolDetail].blurb : ''}</Text>
            <Text style={styles.body}>Owned: {toolDetail ? store.save.inventory[toolDetail] : 0}</Text>
            <View style={{ height: 12 }} />
            <FarmButton label={rewarding ? 'LOADING REWARD…' : store.save.adFree ? 'CLAIM 1 FREE' : 'WATCH AD · GET 1'} onPress={() => toolDetail && watchForTool(toolDetail)} dim={rewarding} />
            <View style={{ height: 10 }} />
            <FarmButton label="CLOSE" onPress={() => setDetail(undefined)} />
          </Panel>
        </View>
      </Modal>
      <Modal visible={!!confirm} transparent animationType="fade">
        <View style={styles.shade}>
          <Panel>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            <Text style={styles.body}>{confirm?.title} for {confirm?.displayPrice}?</Text>
            <View style={{ height: 12 }} />
            <FarmButton label={purchasing ? 'PURCHASING…' : 'BUY NOW'} onPress={() => confirm && buy(confirm)} dim={purchasing} />
            <View style={{ height: 10 }} />
            <FarmButton label="CANCEL" onPress={() => setConfirm(undefined)} />
          </Panel>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  titleBoard: { alignSelf: 'center', minWidth: 250, marginTop: 4, paddingHorizontal: 28, paddingVertical: 9, borderRadius: 14, borderWidth: 3, borderColor: '#c78a32', backgroundColor: 'rgba(68,36,15,0.94)', alignItems: 'center' },
  eyebrow: { color: '#e9c968', fontWeight: '900', fontSize: 9, letterSpacing: 2 },
  title: { color: '#fff6c6', fontWeight: '900', fontSize: 27, lineHeight: 31, textShadowColor: '#1d1408', textShadowRadius: 4 },
  subtitle: { color: '#ead9a7', fontWeight: '700', fontSize: 11 },
  list: { padding: 12, paddingBottom: 28, gap: 10 },
  featureCard: { height: 126, borderRadius: 19, borderWidth: 3, borderColor: '#d6a43d', overflow: 'hidden', backgroundColor: '#3b240f' },
  featureArt: { width: '100%', height: '100%', resizeMode: 'cover' },
  featureShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(35,18,6,.34)' },
  featureCopy: { position: 'absolute', left: 13, bottom: 11, right: 13 },
  featureEyebrow: { color: '#ffd968', fontWeight: '900', fontSize: 9, letterSpacing: 1.5 },
  featureTitle: { color: '#fff8cf', fontWeight: '900', fontSize: 20, textShadowColor: '#231205', textShadowRadius: 4 },
  featureText: { color: '#fff1ba', fontWeight: '700', fontSize: 10 },
  devNotice: { borderRadius: 9, paddingVertical: 6, paddingHorizontal: 9, backgroundColor: 'rgba(41,62,29,.94)', borderWidth: 1, borderColor: '#87b950' },
  devNoticeText: { color: '#e7f5c5', fontWeight: '900', fontSize: 8, textAlign: 'center', letterSpacing: .6 },
  card: { minHeight: 104, backgroundColor: 'rgba(255,242,189,0.96)', borderWidth: 3, borderColor: '#73441f', borderRadius: 18, padding: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#201007', shadowOpacity: 0.34, shadowRadius: 4, shadowOffset: { width: 0, height: 3 } },
  featuredProduct: { borderColor: '#efbd3d', backgroundColor: 'rgba(255,247,202,.98)' },
  valueRibbon: { position: 'absolute', right: 10, top: -7, zIndex: 3, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, backgroundColor: '#d88122', borderWidth: 1, borderColor: '#fff0a0' },
  valueRibbonText: { color: 'white', fontWeight: '900', fontSize: 7, letterSpacing: .7 },
  productArt: { width: 76, height: 82, borderRadius: 14, borderWidth: 2, borderColor: '#d3a24d', backgroundColor: '#f0c75d', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bundleArt: { width: 74, height: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  bundleIcon: { width: 30, height: 46, resizeMode: 'contain', marginHorizontal: -6 },
  bundleIconMain: { width: 38, height: 58, resizeMode: 'contain', zIndex: 2 },
  noAds: { color: '#fff8d1', backgroundColor: '#b33b27', borderRadius: 28, width: 58, height: 58, textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', fontSize: 14, lineHeight: 16, borderWidth: 3, borderColor: '#fff1a2' },
  productCopy: { flex: 1, marginHorizontal: 10 },
  cardTitle: { fontWeight: '900', fontSize: 17, color: '#51351f' },
  blurb: { color: '#6a4522', fontWeight: '700', fontSize: 12, lineHeight: 16, marginTop: 3 },
  contents: { color: '#477126', fontWeight: '900', fontSize: 9, marginTop: 5 },
  priceButton: { backgroundColor: '#5b9f2c', borderWidth: 2, borderColor: '#386b19', borderRadius: 12, minWidth: 72, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  price: { color: 'white', fontWeight: '900', fontSize: 14 },
  ownedPrice: { backgroundColor: '#7d765f', borderColor: '#5d5747' },
  sectionBoard: { alignSelf: 'center', marginTop: 8, backgroundColor: 'rgba(68,36,15,0.94)', borderRadius: 12, borderWidth: 2, borderColor: '#c78a32', paddingHorizontal: 22, paddingVertical: 7 },
  section: { color: '#fff6c6', fontWeight: '900', letterSpacing: 1.2 },
  toolCard: { minHeight: 92, backgroundColor: 'rgba(255,242,189,0.96)', borderWidth: 3, borderColor: '#73441f', borderRadius: 18, padding: 10, flexDirection: 'row', alignItems: 'center' },
  toolArt: { width: 66, height: 66, borderRadius: 14, backgroundColor: '#efc65f', borderWidth: 2, borderColor: '#d3a24d', alignItems: 'center', justifyContent: 'center' },
  tool: { width: 58, height: 58, resizeMode: 'contain' },
  ownedBadge: { minWidth: 58, paddingVertical: 7, borderRadius: 12, backgroundColor: '#51351f', alignItems: 'center' },
  ownedCount: { color: '#ffe36c', fontWeight: '900', fontSize: 18 },
  ownedLabel: { color: '#ead9a7', fontWeight: '900', fontSize: 8 },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#51351f', fontWeight: '700' },
});
