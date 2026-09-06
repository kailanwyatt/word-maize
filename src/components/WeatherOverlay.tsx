import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LevelWeather } from '../game/types';
import { weatherLabel } from '../game/weather';

export function WeatherOverlay({ weather, eventKey = 0, feedback, reducedMotion = false }: {
  weather?: LevelWeather; eventKey?: number; feedback?: string; reducedMotion?: boolean;
}) {
  const ambient = useRef(new Animated.Value(0)).current;
  const event = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!weather || reducedMotion) return;
    ambient.setValue(0);
    const loop = Animated.loop(Animated.timing(ambient, { toValue: 1, duration: weather.kind === 'wind' ? 1700 : 1250, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [ambient, reducedMotion, weather?.kind]);
  useEffect(() => {
    if (!weather || eventKey === 0 || reducedMotion) return;
    event.setValue(0);
    Animated.sequence([
      Animated.timing(event, { toValue: 1, duration: 130, useNativeDriver: true }),
      Animated.delay(weather.kind === 'storm' ? 80 : 260),
      Animated.timing(event, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [event, eventKey, reducedMotion, weather?.kind]);
  if (!weather) return null;
  const raining = weather.kind === 'rain' || weather.kind === 'storm';
  const windy = weather.kind === 'wind' || weather.kind === 'storm';
  const icon = weather.kind === 'rain' ? '☂' : weather.kind === 'wind' ? '➜' : weather.kind === 'drought' ? '☀' : '⚡';
  return <View pointerEvents="none" style={styles.layer} accessibilityLabel={weatherLabel(weather)}>
    {weather.kind === 'drought' ? <View style={styles.droughtWash} /> : null}
    {weather.kind === 'drought' ? Array.from({ length: 5 }, (_, i) => <Animated.View key={`heat-${i}`} style={[styles.heat, { left: `${12 + i * 19}%`, transform: [{ translateY: ambient.interpolate({ inputRange: [0, 1], outputRange: [35, -45] }) }], opacity: ambient.interpolate({ inputRange: [0, .5, 1], outputRange: [.05, .22, .05] }) }]} />) : null}
    {raining ? Array.from({ length: 18 }, (_, i) => <Animated.View key={`rain-${i}`} style={[styles.drop, { left: `${2 + ((i * 29) % 96)}%`, top: `${-10 + ((i * 19) % 72)}%`, opacity: .18 + (i % 3) * .08, transform: [{ translateY: ambient.interpolate({ inputRange: [0, 1], outputRange: [-60, 610] }) }, { translateX: windy ? -45 : -12 }, { rotate: windy ? '24deg' : '12deg' }] }]} />) : null}
    {windy ? Array.from({ length: 7 }, (_, i) => <Animated.View key={`gust-${i}`} style={[styles.gust, { top: `${24 + i * 9}%`, width: `${42 + (i % 3) * 18}%`, opacity: event.interpolate({ inputRange: [0, 1], outputRange: [.05, .55] }), transform: [{ translateX: event.interpolate({ inputRange: [0, 1], outputRange: [-280, 430] }) }, { rotate: '-7deg' }] }]} />) : null}
    {weather.kind === 'storm' ? <Animated.View style={[styles.lightning, { opacity: event }]} /> : null}
    <View style={[styles.badge, styles[`${weather.kind}Badge`]]}><Text style={styles.icon}>{icon}</Text><Text style={styles.label}>{weatherLabel(weather)}</Text></View>
    {feedback ? <Animated.View style={[styles.feedback, { opacity: reducedMotion ? 1 : event, transform: [{ scale: reducedMotion ? 1 : event.interpolate({ inputRange: [0, 1], outputRange: [.82, 1] }) }] }]}><Text style={styles.feedbackText}>{feedback}</Text></Animated.View> : null}
  </View>;
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', inset: 0, zIndex: 3, overflow: 'hidden' },
  badge: { position: 'absolute', top: 92, alignSelf: 'center', minHeight: 28, paddingHorizontal: 10, borderRadius: 14, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 5, zIndex: 4 },
  rainBadge: { backgroundColor: 'rgba(19,77,121,.9)', borderColor: '#8edcff' }, windBadge: { backgroundColor: 'rgba(74,91,103,.92)', borderColor: '#d9f5ff' }, droughtBadge: { backgroundColor: 'rgba(123,68,20,.92)', borderColor: '#ffc95c' }, stormBadge: { backgroundColor: 'rgba(36,31,72,.94)', borderColor: '#c9c7ff' },
  icon: { color: 'white', fontSize: 13, fontWeight: '900' }, label: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  drop: { position: 'absolute', width: 2, height: 34, borderRadius: 2, backgroundColor: '#c9efff' }, gust: { position: 'absolute', left: 0, height: 3, borderRadius: 3, backgroundColor: '#effcff' },
  droughtWash: { position: 'absolute', inset: 0, backgroundColor: 'rgba(194,112,22,.13)' }, heat: { position: 'absolute', bottom: '15%', width: 3, height: 90, borderRadius: 8, backgroundColor: '#ffe5a0' }, lightning: { position: 'absolute', inset: 0, backgroundColor: 'rgba(239,243,255,.46)' },
  feedback: { position: 'absolute', top: 128, alignSelf: 'center', zIndex: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 2, borderColor: '#fff4ad', backgroundColor: 'rgba(54,35,17,.92)' }, feedbackText: { color: '#fff7bf', fontWeight: '900', fontSize: 12, letterSpacing: .7 },
});
