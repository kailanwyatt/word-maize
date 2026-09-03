import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { FarmButton, Panel } from '../components/FarmButton';
import { SHOP_PRODUCTS, ShopProduct, TOOL_INFO } from '../data/shop';
import { ToolId } from '../game/types';
import { purchaseProduct } from '../monetization/purchases';
import { useGameStore } from '../store/GameStore';

export function ShopScreen() {
  const router = useRouter();
  const store = useGameStore();
  const [detail, setDetail] = useState<ShopProduct | ToolId | undefined>();
  const [confirm, setConfirm] = useState<ShopProduct | undefined>();
  const buy = async (product: ShopProduct) => {
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
  };
  const productDetail = typeof detail === 'object' ? detail : undefined;
  const toolDetail = typeof detail === 'string' ? detail : undefined;
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.shopBarn} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <Text style={styles.title}>Farm Store</Text>
        <ScrollView contentContainerStyle={styles.list}>
          {SHOP_PRODUCTS.map(product => (
            <Pressable key={product.id} style={styles.card} onPress={() => setDetail(product)}>
              <Text style={styles.cardTitle}>{product.title}</Text>
              <Text style={styles.blurb}>{product.blurb}</Text>
              <Text style={styles.price}>{product.displayPrice}</Text>
            </Pressable>
          ))}
          <Text style={styles.section}>Tools you own</Text>
          {(Object.keys(TOOL_INFO) as ToolId[]).map(tool => (
            <Pressable key={tool} style={styles.card} onPress={() => setDetail(tool)}>
              <Image source={wordMaizeAssets.powerups[tool]} style={styles.tool} />
              <Text style={styles.cardTitle}>{TOOL_INFO[tool].title} ×{store.save.inventory[tool]}</Text>
              <Text style={styles.blurb}>{TOOL_INFO[tool].blurb}</Text>
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
            <FarmButton label="BUY NOW" onPress={() => confirm && buy(confirm)} />
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
  title: { textAlign: 'center', color: '#fff6c6', fontWeight: '900', fontSize: 28, marginVertical: 10, textShadowColor: '#1d1408', textShadowRadius: 4 },
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: 'rgba(255,242,189,0.94)', borderWidth: 3, borderColor: '#73441f', borderRadius: 16, padding: 14 },
  cardTitle: { fontWeight: '900', fontSize: 18, color: '#51351f' },
  blurb: { color: '#6a4522', fontWeight: '700', marginTop: 4 },
  price: { marginTop: 8, color: '#406f20', fontWeight: '900', fontSize: 16 },
  section: { color: '#fff6c6', fontWeight: '900', marginTop: 8 },
  tool: { width: 42, height: 42, resizeMode: 'contain', marginBottom: 4 },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#51351f', fontWeight: '700' },
});
