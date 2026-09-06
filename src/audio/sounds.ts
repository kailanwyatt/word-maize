import { audioManager } from './AudioManager';

export type GameSound = 'tap' | 'backtrack' | 'valid' | 'invalid' | 'rotate' | 'basket' | 'coin' | 'complete';

const SOUND_SOURCES = {
  tap: require('../../assets/word-maize/audio/kernel-tap.wav'),
  backtrack: require('../../assets/word-maize/audio/backtrack.wav'),
  valid: require('../../assets/word-maize/audio/valid-word.wav'),
  invalid: require('../../assets/word-maize/audio/invalid-word.wav'),
  rotate: require('../../assets/word-maize/audio/cob-rotate.wav'),
  basket: require('../../assets/word-maize/audio/basket-land.wav'),
  coin: require('../../assets/word-maize/audio/coin.wav'),
  complete: require('../../assets/word-maize/audio/level-complete.wav'),
} as const;

export const FARM_AMBIENCE = require('../../assets/word-maize/audio/farm-ambience.wav');

export function playGameSound(sound: GameSound, volume = 0.8) {
  audioManager.playSfx(SOUND_SOURCES[sound], volume).catch(() => {});
}
