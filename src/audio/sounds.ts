import { preload, type AudioSource } from 'expo-audio';
import { audioManager } from './AudioManager';

export type GameSound = 'tap' | 'backtrack' | 'valid' | 'invalid' | 'rotate' | 'basket' | 'coin' | 'complete';

const SOUND_SOURCES: Record<GameSound, AudioSource> = {
  tap: require('../../assets/word-maize/audio/kernel-tap.wav'),
  backtrack: require('../../assets/word-maize/audio/backtrack.wav'),
  valid: require('../../assets/word-maize/audio/valid-word.wav'),
  invalid: require('../../assets/word-maize/audio/invalid-word.wav'),
  rotate: require('../../assets/word-maize/audio/cob-rotate.wav'),
  basket: require('../../assets/word-maize/audio/basket-land.wav'),
  coin: require('../../assets/word-maize/audio/coin.wav'),
  complete: require('../../assets/word-maize/audio/level-complete.wav'),
};

export const FARM_AMBIENCE: AudioSource = require('../../assets/word-maize/audio/farm-ambience.wav');

function preloadQuietly(source: AudioSource) {
  try {
    // Native preload returns a Promise; web returns void.
    void Promise.resolve(preload(source)).catch(() => {});
  } catch {
    // Audio should never block app boot.
  }
}

Object.values(SOUND_SOURCES).forEach(preloadQuietly);
preloadQuietly(FARM_AMBIENCE);

export function playGameSound(sound: GameSound, volume = 0.8) {
  audioManager.playSfx(SOUND_SOURCES[sound], volume).catch(() => {});
}
