import { useRouter } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Alert, Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { DialogCopy, FarmDialog } from '../components/FarmDialog';
import { RaisedBoard } from '../components/RaisedBoard';
import { COIN_TOOL_OFFERS, CoinToolOffer, SHOP_PRODUCTS, ShopProduct, TOOL_INFO, coinOfferForTool } from '../data/shop';
import { Inventory, TOOL_IDS, ToolId } from '../game/types';
import { playGameSound } from '../audio/sounds';
import { purchaseProduct } from '../monetization/purchases';
import { showRewardedAd } from '../monetization/ads';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../monetization/config';
import { useGameStore } from '../store/GameStore';

type ShopTab = 'packs' | 'tools' | 'decor' | 'special';

const TABS: { id: ShopTab; label: string }[] = [
  { id: 'packs', label: 'Coin Packs' },
  { id: 'tools', label: 'Tools' },
  { id: 'decor', label: 'Decor' },
  { id: 'special', label: 'Special' },
];

const COIN_PACK_IDS = ['coin_sack', 'coin_bushel', 'coin_barn'] as const;
const TOOL_KIT_IDS = ['starter_shed', 'farmers_toolbox', 'field_kit', 'master_harvester'] as const;

function offerLine(tools: Partial<Inventory>) {
  return Object.entries(tools).filter(([, amount]) => amount).map(([tool, amount]) => `${amount} ${TOOL_INFO[tool as ToolId].title}`).join(' · ');
}

function productContents(product: ShopProduct) {
  if (product.coins) return `${product.coins.toLocaleString('en-US')} coins`;
  if (product.tools) return offerLine(product.tools);
  return 'Permanent account upgrade';
}

export function ShopScreen() {
  const router = useRouter();
  const store = useGameStore();
  const [tab, setTab] = useState<ShopTab>('packs');
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
      if (result.coins) store.addCoins(result.coins);
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
  const watchForTool = async (tool: ToolId) => {
    if (rewarding) return;
    setRewarding(true);
    const result = await showRewardedAd('tool', store.save.adFree);
    if (result.rewarded) {
      store.addTools({ [tool]: 1 });
      playGameSound('reward', 0.72);
      Alert.alert('Helper earned', `1 ${TOOL_INFO[tool].title} was added to your Barn.`);
    } else Alert.alert('Reward unavailable', result.message ?? 'The rewarded ad could not be shown.');
    setRewarding(false);
  };
  const buyWithCoins = (offer: CoinToolOffer) => {
    if (store.save.coins < offer.coins) {
      Alert.alert('Need more coins', `${offer.title} costs ${offer.coins} coins. Harvest a few more words and come back.`);
      return;
    }
    if (!store.buyCoinOffer(offer.id)) {
      Alert.alert('Need more coins', `${offer.title} costs ${offer.coins} coins.`);
      return;
    }
    playGameSound('coin', 0.7);
    Alert.alert('Tools packed', `${offer.title} was added to your Barn.`);
  };
  const coinPacks = COIN_PACK_IDS.map(id => SHOP_PRODUCTS.find(product => product.id === id)!).filter(Boolean);
  const toolKits = TOOL_KIT_IDS.map(id => SHOP_PRODUCTS.find(product => product.id === id)!).filter(Boolean);
  const special = SHOP_PRODUCTS.find(product => product.entitlement === 'ad_free');

  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.shopBarn} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <RaisedBoard wood radius={16} depth={4} wrapStyle={styles.signWrap} style={styles.signFace}>
            <Text style={styles.signTitle}>FARM STORE</Text>
            <Text style={styles.signSub}>Tools, helpers, and boosts for your harvest</Text>
          </RaisedBoard>

          <View style={styles.pills}>
            {TABS.map(item => {
              const on = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={item.label}
                  onPress={() => setTab(item.id)}
                  style={[styles.pill, on && styles.pillOn]}
                >
                  <TabGlyph tab={item.id} on={on} />
                  <Text style={[styles.pillText, on && styles.pillTextOn]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {__DEV__ ? <View style={styles.devNotice}><Text style={styles.devNoticeText}>DEVELOPMENT PREVIEW · STORE PURCHASES GRANT TEST ITEMS</Text></View> : null}

          {tab === 'packs' ? (
            <>
              <CatalogPanel
                icon={<Image source={wordMaizeAssets.ui.coin} style={styles.sectionIcon} />}
                title="COIN PACKS"
                subtitle="Stock up on coins to get tools, helpers, and more."
              >
                {coinPacks.map(product => (
                  <CatalogRow
                    key={product.id}
                    art={<Image source={product.id === 'coin_barn' ? wordMaizeAssets.props.chest : wordMaizeAssets.ui.coin} style={styles.packArt} />}
                    title={product.title}
                    blurb={product.blurb}
                    meta={productContents(product)}
                    bestValue={product.id === 'coin_bushel'}
                    onPress={() => setDetail(product)}
                    cta={<IapPrice label={product.displayPrice} />}
                  />
                ))}
              </CatalogPanel>
              <CatalogPanel
                icon={<Image source={wordMaizeAssets.powerups.mower} style={styles.sectionIcon} />}
                title="SPEND HARVEST COINS"
                subtitle="Get tools and helpers to make your maze even more fun."
              >
                {COIN_TOOL_OFFERS.map(offer => (
                  <CatalogRow
                    key={offer.id}
                    art={<Image source={offerArtSource(offer.tools)} style={styles.toolArt} />}
                    title={offer.title}
                    blurb={offer.blurb}
                    meta={offerLine(offer.tools)}
                    onPress={() => buyWithCoins(offer)}
                    cta={<CoinPrice amount={offer.coins} dim={store.save.coins < offer.coins} />}
                  />
                ))}
              </CatalogPanel>
            </>
          ) : null}

          {tab === 'tools' ? (
            <>
              <CatalogPanel
                icon={<Image source={wordMaizeAssets.ui.tabShop} style={styles.sectionIcon} />}
                title="TOOL KITS"
                subtitle="IAP bundles that restock the Barn in one purchase."
              >
                {toolKits.map(product => (
                  <CatalogRow
                    key={product.id}
                    art={offerArt(product.tools ?? {})}
                    title={product.title}
                    blurb={product.blurb}
                    meta={productContents(product)}
                    onPress={() => setDetail(product)}
                    cta={<IapPrice label={product.displayPrice} />}
                  />
                ))}
              </CatalogPanel>
              <CatalogPanel
                icon={<Image source={wordMaizeAssets.powerups.scarecrow} style={styles.sectionIcon} />}
                title="YOUR BARN"
                subtitle="Tap a helper to watch an ad or buy one with coins."
              >
                {TOOL_IDS.map(tool => (
                  <CatalogRow
                    key={tool}
                    art={<Image source={wordMaizeAssets.powerups[tool]} style={styles.toolArt} />}
                    title={TOOL_INFO[tool].title}
                    blurb={TOOL_INFO[tool].blurb}
                    onPress={() => setDetail(tool)}
                    cta={
                      <View style={styles.ownedBadge}>
                        <Text style={styles.ownedCount}>×{store.save.inventory[tool] ?? 0}</Text>
                        <Text style={styles.ownedLabel}>BARN</Text>
                      </View>
                    }
                  />
                ))}
              </CatalogPanel>
            </>
          ) : null}

          {tab === 'decor' ? (
            <CatalogPanel
              icon={<Image source={wordMaizeAssets.kernels.approvedNormal} style={styles.sectionIcon} />}
              title="DECOR"
              subtitle="Farm dressing for the valley is still growing."
            >
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Coming soon</Text>
                <Text style={styles.emptyBody}>No decorations to buy yet. Helpers and coin packs are on the other shelves.</Text>
              </View>
            </CatalogPanel>
          ) : null}

          {tab === 'special' && special ? (
            <CatalogPanel
              icon={<Image source={wordMaizeAssets.ui.mapStarFilled} style={styles.sectionIcon} />}
              title="SPECIAL"
              subtitle="A one-time upgrade for the whole farm."
            >
              <CatalogRow
                art={<View style={styles.noAds}><Text style={styles.noAdsText}>ADS{'\n'}OFF</Text></View>}
                title={special.title}
                blurb={special.blurb}
                meta={productContents(special)}
                onPress={() => setDetail(special)}
                cta={<IapPrice label={store.save.adFree ? 'OWNED' : special.displayPrice} dim={store.save.adFree} />}
              />
            </CatalogPanel>
          ) : null}

          <View style={styles.legalRow}>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}><Text style={styles.legalLink}>Privacy Policy</Text></Pressable>
            <Text style={styles.legalDot}>•</Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(TERMS_URL)}><Text style={styles.legalLink}>Terms of Use</Text></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
      <FarmDialog
        visible={!!productDetail}
        title={productDetail?.title ?? 'Shop'}
        onClose={() => setDetail(undefined)}
        primary={{ label: `BUY ${productDetail?.displayPrice ?? ''}`, onPress: () => productDetail && setConfirm(productDetail), dim: productDetail?.entitlement === 'ad_free' && store.save.adFree, tone: 'gold' }}
      >
        <DialogCopy>{productDetail?.blurb ?? ''}</DialogCopy>
      </FarmDialog>
      <FarmDialog
        visible={!!toolDetail}
        title={toolDetail ? TOOL_INFO[toolDetail].title : 'Tool'}
        onClose={() => setDetail(undefined)}
        primary={{ label: rewarding ? 'LOADING REWARD…' : store.save.adFree ? 'CLAIM 1 FREE' : 'WATCH AD · GET 1', onPress: () => toolDetail && watchForTool(toolDetail), dim: rewarding }}
        actions={toolDetail && coinOfferForTool(toolDetail) ? [{
          label: `BUY 1 · ${coinOfferForTool(toolDetail)?.coins} COINS`,
          onPress: () => {
            const offer = coinOfferForTool(toolDetail);
            if (offer) buyWithCoins(offer);
          },
          dim: store.save.coins < (coinOfferForTool(toolDetail)?.coins ?? 0),
          tone: 'gold',
        }] : undefined}
      >
        <DialogCopy>{toolDetail ? TOOL_INFO[toolDetail].blurb : ''}</DialogCopy>
        <DialogCopy>In the Barn: {toolDetail ? store.save.inventory[toolDetail] ?? 0 : 0}</DialogCopy>
      </FarmDialog>
      <FarmDialog
        visible={!!confirm}
        title="Confirm Purchase"
        onClose={() => setConfirm(undefined)}
        primary={{ label: purchasing ? 'PURCHASING…' : 'BUY NOW', onPress: () => confirm && buy(confirm), dim: purchasing, tone: 'gold' }}
        actions={[{ label: 'CANCEL', onPress: () => setConfirm(undefined), tone: 'slate' }]}
      >
        <DialogCopy>{confirm?.title} for {confirm?.displayPrice}?</DialogCopy>
      </FarmDialog>
    </ImageBackground>
  );
}

function TabGlyph({ tab, on }: { tab: ShopTab; on: boolean }) {
  if (tab === 'packs') return <Image source={wordMaizeAssets.ui.coin} style={styles.pillIcon} />;
  if (tab === 'tools') return <Image source={wordMaizeAssets.ui.tabShop} style={[styles.pillIcon, on && styles.pillIconOn]} />;
  if (tab === 'decor') return <Image source={wordMaizeAssets.kernels.approvedNormal} style={styles.pillIcon} />;
  return <Image source={wordMaizeAssets.ui.mapStarFilled} style={styles.pillIcon} />;
}

function offerArtSource(tools: Partial<Inventory>) {
  const ids = (Object.keys(tools) as ToolId[]).filter(tool => tools[tool]);
  return wordMaizeAssets.powerups[ids.find(tool => tool !== 'scarecrow') ?? ids[0] ?? 'scarecrow'];
}

function offerArt(tools: Partial<Inventory>) {
  const ids = (Object.keys(tools) as ToolId[]).filter(tool => tools[tool]);
  if (!ids.length) return <Image source={wordMaizeAssets.ui.coin} style={styles.toolArt} />;
  const main = ids.find(tool => tools[tool] && tool !== 'scarecrow') ?? ids[0];
  return (
    <View style={styles.bundleArt}>
      {ids.filter(tool => tool !== main).slice(0, 2).map(tool => (
        <Image key={tool} source={wordMaizeAssets.powerups[tool]} style={styles.bundleIcon} />
      ))}
      <Image source={wordMaizeAssets.powerups[main]} style={styles.bundleIconMain} />
    </View>
  );
}

function CatalogPanel({
  icon, title, subtitle, children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <View style={styles.panelIcon}>{icon}</View>
        <View style={styles.panelCopy}>
          <Text style={styles.panelTitle}>{title}</Text>
          <Text style={styles.panelSub}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function CatalogRow({
  art, title, blurb, meta, bestValue, onPress, cta,
}: {
  art: ReactNode;
  title: string;
  blurb: string;
  meta?: string;
  bestValue?: boolean;
  onPress: () => void;
  cta: ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={[styles.row, bestValue && styles.rowRibbon]}>
      {bestValue ? <View style={styles.valueRibbon}><Text style={styles.valueRibbonText}>BEST VALUE</Text></View> : null}
      <View style={styles.rowArt}>{art}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.rowBlurb} numberOfLines={2}>{blurb}</Text>
        {meta ? <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {cta}
    </Pressable>
  );
}

function IapPrice({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <View style={[styles.iapBtn, dim && styles.iapDim]}>
      <Text style={styles.iapText}>{label}</Text>
    </View>
  );
}

function CoinPrice({ amount, dim }: { amount: number; dim?: boolean }) {
  return (
    <View style={[styles.coinBtn, dim && styles.coinDim]}>
      <Image source={wordMaizeAssets.ui.coin} style={styles.priceCoin} />
      <Text style={styles.coinText}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 28, gap: 10 },
  signWrap: { alignSelf: 'center', minWidth: 248, maxWidth: 320 },
  signFace: { paddingHorizontal: 22, paddingVertical: 10, alignItems: 'center' },
  signTitle: { color: '#fff6c6', fontWeight: '900', fontSize: 26, letterSpacing: 1.2, textShadowColor: '#1d1408', textShadowRadius: 4 },
  signSub: { color: '#ead9a7', fontWeight: '700', fontSize: 11, textAlign: 'center', marginTop: 2 },
  pills: { flexDirection: 'row', gap: 6 },
  pill: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 244, 214, 0.92)',
    borderWidth: 2,
    borderColor: '#c9a15a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  pillOn: { backgroundColor: '#4f9a28', borderColor: '#fff3a0' },
  pillIcon: { width: 18, height: 18, resizeMode: 'contain' },
  pillIconOn: { tintColor: '#fff6c6' },
  pillText: { color: '#6a4420', fontWeight: '900', fontSize: 8, letterSpacing: 0.1, marginTop: 2, textAlign: 'center' },
  pillTextOn: { color: '#fff6c6' },
  devNotice: { borderRadius: 9, paddingVertical: 6, paddingHorizontal: 9, backgroundColor: 'rgba(41,62,29,.94)', borderWidth: 1, borderColor: '#87b950' },
  devNoticeText: { color: '#e7f5c5', fontWeight: '900', fontSize: 8, textAlign: 'center', letterSpacing: 0.6 },
  panel: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 246, 220, 0.96)',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingBottom: 8 },
  panelIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sectionIcon: { width: 32, height: 32, resizeMode: 'contain' },
  panelCopy: { flex: 1, minWidth: 0 },
  panelTitle: { color: '#3d2a14', fontWeight: '900', fontSize: 15, letterSpacing: 0.6 },
  panelSub: { color: '#7a5828', fontWeight: '700', fontSize: 11, marginTop: 2, lineHeight: 14 },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#ead9a7',
    position: 'relative',
  },
  rowRibbon: { paddingTop: 22 },
  valueRibbon: { position: 'absolute', left: 6, top: 4, zIndex: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#c44a2a', borderWidth: 1, borderColor: '#fff0a0' },
  valueRibbonText: { color: 'white', fontWeight: '900', fontSize: 7, letterSpacing: 0.6 },
  rowArt: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  packArt: { width: 44, height: 44, resizeMode: 'contain' },
  toolArt: { width: 46, height: 46, resizeMode: 'contain' },
  bundleArt: { width: 52, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  bundleIcon: { width: 22, height: 36, resizeMode: 'contain', marginHorizontal: -6 },
  bundleIconMain: { width: 32, height: 48, resizeMode: 'contain', zIndex: 2 },
  noAds: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#b33b27', borderWidth: 2, borderColor: '#fff1a2', alignItems: 'center', justifyContent: 'center' },
  noAdsText: { color: '#fff8d1', fontWeight: '900', fontSize: 11, lineHeight: 13, textAlign: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontWeight: '900', fontSize: 15, color: '#3d2a14' },
  rowBlurb: { color: '#7a5828', fontWeight: '700', fontSize: 11, lineHeight: 14, marginTop: 2 },
  rowMeta: { color: '#4f7f26', fontWeight: '800', fontSize: 10, marginTop: 3 },
  iapBtn: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#58c22e',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#9ef06a',
    borderBottomColor: '#1d6a12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iapDim: { backgroundColor: '#7d765f', borderColor: '#c9c2a8', borderBottomColor: '#5d5747' },
  iapText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  coinBtn: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#ead071',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#fff3a0',
    borderBottomColor: '#8a5a22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  coinDim: { opacity: 0.55 },
  coinText: { color: '#5a2808', fontWeight: '900', fontSize: 14 },
  priceCoin: { width: 16, height: 16, resizeMode: 'contain' },
  ownedBadge: { minWidth: 52, paddingVertical: 6, borderRadius: 12, backgroundColor: '#51351f', alignItems: 'center' },
  ownedCount: { color: '#ffe36c', fontWeight: '900', fontSize: 16 },
  ownedLabel: { color: '#ead9a7', fontWeight: '900', fontSize: 8 },
  empty: { paddingHorizontal: 10, paddingVertical: 18, alignItems: 'center' },
  emptyTitle: { color: '#3d2a14', fontWeight: '900', fontSize: 16 },
  emptyBody: { color: '#7a5828', fontWeight: '700', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  legalRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  legalLink: { color: '#fff3ba', fontWeight: '800', textDecorationLine: 'underline' },
  legalDot: { color: '#e5bd63', fontWeight: '900' },
});
