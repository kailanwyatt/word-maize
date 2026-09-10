import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { CoinToolOffer, SHOP_PRODUCTS, ShopProduct, TOOL_INFO, coinOfferForTool } from '../../data/shop';
import { MAZE_TOOL_IDS, type ToolId } from '../../game/types';
import { useMessages } from '../../i18n';
import { showRewardedAd } from '../../monetization/ads';
import { purchaseProduct } from '../../monetization/purchases';
import { playGameSound } from '../../audio/sounds';
import { useGameStore } from '../../store/GameStore';
import { DialogCopy, FarmDialog } from '../FarmDialog';

export type FieldBarnRestock = ToolId | 'browse';

export function FieldBarnDialog({
  restock,
  onClose,
  onBrowse,
  onPacked,
}: {
  restock: FieldBarnRestock | null;
  onClose: () => void;
  onBrowse: () => void;
  onPacked?: (message: string) => void;
}) {
  const t = useMessages();
  const store = useGameStore();
  const [rewarding, setRewarding] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const focus = restock && restock !== 'browse' ? restock : undefined;
  const browsing = restock === 'browse';
  const offer = focus ? coinOfferForTool(focus) : undefined;
  const mazeOffers = MAZE_TOOL_IDS.map(tool => coinOfferForTool(tool)).filter((item): item is CoinToolOffer => !!item);
  const coinPacks = SHOP_PRODUCTS.filter(product => product.coins);

  const packed = (tool: ToolId, extra?: string) => {
    onPacked?.(extra ?? t.fieldBarn.packed.replace('{tool}', TOOL_INFO[tool].title));
  };

  const buyOffer = (item: CoinToolOffer, closeAfter: boolean) => {
    if (store.save.coins < item.coins) {
      Alert.alert(t.fieldBarn.needCoinsTitle, t.fieldBarn.needCoinsBody.replace('{title}', item.title).replace('{n}', String(item.coins)));
      return false;
    }
    if (!store.buyCoinOffer(item.id)) {
      Alert.alert(t.fieldBarn.needCoinsTitle, t.fieldBarn.needCoinsBody.replace('{title}', item.title).replace('{n}', String(item.coins)));
      return false;
    }
    const tool = (Object.keys(item.tools) as ToolId[]).find(id => item.tools[id]) ?? 'lantern';
    playGameSound('coin', 0.7);
    packed(tool);
    if (closeAfter) onClose();
    return true;
  };

  const watchForTool = async (tool: ToolId, closeAfter: boolean) => {
    if (rewarding) return;
    setRewarding(true);
    const result = await showRewardedAd('tool', store.save.adFree);
    if (result.rewarded) {
      store.addTools({ [tool]: 1 });
      playGameSound('reward', 0.72);
      packed(tool, t.fieldBarn.earned.replace('{tool}', TOOL_INFO[tool].title));
      if (closeAfter) onClose();
    } else {
      Alert.alert(t.fieldBarn.rewardUnavailable, result.message ?? t.fieldBarn.rewardUnavailableBody);
    }
    setRewarding(false);
  };

  const buyPack = async (product: ShopProduct) => {
    if (purchasing) return;
    setPurchasing(true);
    const result = await purchaseProduct(product);
    if (result.ok) {
      if (result.adFree) store.setAdFree(true);
      if (result.tools) store.addTools(result.tools);
      if (result.coins) store.addCoins(result.coins);
      playGameSound('coin', 0.7);
      Alert.alert(t.fieldBarn.harvestStored, result.message ?? t.fieldBarn.thanks);
    } else {
      Alert.alert(t.fieldBarn.purchase, result.message ?? t.fieldBarn.purchaseFailed);
    }
    setPurchasing(false);
  };

  return (
    <>
      <FarmDialog
        visible={!!focus}
        title={t.fieldBarn.outOfTitle.replace('{tool}', focus ? TOOL_INFO[focus].title : '')}
        onClose={onClose}
        primary={offer ? {
          label: t.fieldBarn.buyCoins.replace('{n}', String(offer.coins)),
          onPress: () => buyOffer(offer, true),
          dim: store.save.coins < offer.coins,
          tone: 'gold',
        } : undefined}
        actions={[
          {
            label: rewarding ? t.fieldBarn.loadingReward : store.save.adFree ? t.fieldBarn.claimFree : t.fieldBarn.watchAd,
            onPress: () => focus && watchForTool(focus, true),
            dim: rewarding,
          },
          { label: t.fieldBarn.browse, onPress: onBrowse, tone: 'gold' },
          { label: t.fieldBarn.keep, onPress: onClose, tone: 'slate' },
        ]}
      >
        {focus ? <Image source={wordMaizeAssets.powerups[focus]} style={styles.hero} /> : null}
        <DialogCopy>{focus ? TOOL_INFO[focus].blurb : ''}</DialogCopy>
        <DialogCopy>{t.fieldBarn.outOfBody.replace('{tool}', focus ? TOOL_INFO[focus].title : '')}</DialogCopy>
        <DialogCopy>{t.fieldBarn.inBarn.replace('{n}', String(focus ? store.save.inventory[focus] ?? 0 : 0))}</DialogCopy>
        <CoinsLine coins={store.save.coins} />
      </FarmDialog>

      <FarmDialog
        visible={browsing}
        title={t.fieldBarn.title}
        onClose={onClose}
        primary={{ label: t.fieldBarn.back, onPress: onClose }}
      >
        <DialogCopy>{t.fieldBarn.body}</DialogCopy>
        <CoinsLine coins={store.save.coins} />
        {mazeOffers.map(item => {
          const tool = (Object.keys(item.tools) as ToolId[]).find(id => item.tools[id]);
          if (!tool) return null;
          const broke = store.save.coins < item.coins;
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.art}><Image source={wordMaizeAssets.powerups[tool]} style={styles.icon} /></View>
              <View style={styles.copy}>
                <Text style={styles.name}>{TOOL_INFO[tool].title}</Text>
                <Text style={styles.owned}>×{store.save.inventory[tool] ?? 0} {t.fieldBarn.barn}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t.fieldBarn.buyCoins.replace('{n}', String(item.coins))}, ${TOOL_INFO[tool].title}`}
                disabled={broke}
                onPress={() => buyOffer(item, false)}
                style={[styles.buy, broke && styles.buyDim]}
              >
                <Image source={wordMaizeAssets.ui.coin} style={styles.buyCoin} />
                <Text style={styles.buyText}>{item.coins}</Text>
              </Pressable>
            </View>
          );
        })}
        <Text style={styles.section}>{t.fieldBarn.coinPacks}</Text>
        {coinPacks.map(product => (
          <Pressable
            key={product.id}
            accessibilityRole="button"
            disabled={purchasing}
            onPress={() => buyPack(product)}
            style={styles.pack}
          >
            <Image source={wordMaizeAssets.ui.coin} style={styles.packCoin} />
            <View style={styles.copy}>
              <Text style={styles.name}>{product.title}</Text>
              <Text style={styles.owned}>{product.blurb}</Text>
            </View>
            <Text style={styles.price}>{purchasing ? '…' : product.displayPrice}</Text>
          </Pressable>
        ))}
      </FarmDialog>
    </>
  );
}

function CoinsLine({ coins }: { coins: number }) {
  return (
    <View style={styles.coins}>
      <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
      <Text style={styles.coinsText}>{coins.toLocaleString('en-US')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: 72, height: 72, resizeMode: 'contain', alignSelf: 'center', marginBottom: 8 },
  coins: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 },
  coin: { width: 22, height: 22, resizeMode: 'contain' },
  coinsText: { color: '#3d2a14', fontWeight: '900', fontSize: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 58, marginBottom: 8, backgroundColor: 'rgba(255,248,230,0.92)', borderRadius: 14, borderWidth: 2, borderColor: '#c9a15a', paddingHorizontal: 8, paddingVertical: 6 },
  art: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#efc65f', borderWidth: 2, borderColor: '#d3a24d', alignItems: 'center', justifyContent: 'center' },
  icon: { width: 36, height: 36, resizeMode: 'contain' },
  copy: { flex: 1 },
  name: { color: '#3d2a14', fontWeight: '900', fontSize: 15 },
  owned: { color: '#7a5828', fontWeight: '700', fontSize: 11, marginTop: 1 },
  buy: { minWidth: 64, minHeight: 40, borderRadius: 12, backgroundColor: '#5b9f2c', borderWidth: 2, borderColor: '#386b19', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  buyDim: { backgroundColor: '#7d765f', borderColor: '#5d5747' },
  buyCoin: { width: 14, height: 14, resizeMode: 'contain' },
  buyText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  section: { color: '#7a5828', fontWeight: '900', fontSize: 11, letterSpacing: 1.1, textAlign: 'center', marginTop: 6, marginBottom: 8 },
  pack: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, marginBottom: 8, backgroundColor: 'rgba(255,242,189,0.96)', borderRadius: 14, borderWidth: 2, borderColor: '#73441f', paddingHorizontal: 8 },
  packCoin: { width: 28, height: 28, resizeMode: 'contain' },
  price: { color: '#245818', fontWeight: '900', fontSize: 14 },
});
