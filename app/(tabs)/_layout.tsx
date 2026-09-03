import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TabIcon } from '../../src/components/TabIcons';

function TabBarWood() {
  return (
    <View style={styles.wood}>
      <View style={styles.woodRim} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="play"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: { flex: 1 },
        tabBarBackground: () => <TabBarWood />,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 78,
          paddingTop: 8,
          paddingBottom: 10,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Farm',
          tabBarAccessibilityLabel: 'Farm',
          tabBarIcon: ({ focused }) => <TabIcon label="FARM" focused={focused} kind="farm" />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarAccessibilityLabel: 'Play',
          tabBarIcon: ({ focused }) => <TabIcon label="PLAY" focused={focused} kind="play" />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarAccessibilityLabel: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon label="SHOP" focused={focused} kind="shop" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wood: { flex: 1, backgroundColor: '#3b2410' },
  woodRim: { height: 5, backgroundColor: '#5c3a18' },
});
