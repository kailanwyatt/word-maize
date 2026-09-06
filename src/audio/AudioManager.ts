import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';
import { Platform } from 'react-native';

type AudioPreferences = { music: boolean; sfx: boolean };

class WordMaizeAudioManager {
  private music: AudioPlayer | null = null;
  private sfxPlayers = new Map<AudioSource, AudioPlayer>();
  private preferences: AudioPreferences = { music: true, sfx: true };
  private active = true;
  private unlocked = Platform.OS !== 'web';
  private configured = false;

  async configure() {
    if (this.configured) return;
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
      allowsRecording: false,
    });
    this.configured = true;
  }

  async setPreferences(preferences: AudioPreferences) {
    this.preferences = preferences;
    this.syncMusic();
  }

  async setAppActive(active: boolean) {
    this.active = active;
    await setIsAudioActiveAsync(active).catch(() => {});
    this.syncMusic();
  }

  async loadMusic(source: AudioSource) {
    await this.configure();
    this.releasePlayer(this.music);
    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 0.45;
    this.music = player;
    this.syncMusic();
  }

  async playSfx(source: AudioSource, volume = 0.8) {
    if (!this.preferences.sfx || !this.active) return;
    await this.configure();
    this.unlocked = true;
    this.syncMusic();
    let player = this.sfxPlayers.get(source);
    if (!player) {
      player = createAudioPlayer(source, { keepAudioSessionActive: true });
      this.sfxPlayers.set(source, player);
    }
    player.volume = volume;
    await player.seekTo(0);
    player.play();
  }

  async dispose() {
    this.releasePlayer(this.music);
    this.music = null;
    for (const player of this.sfxPlayers.values()) this.releasePlayer(player);
    this.sfxPlayers.clear();
  }

  private syncMusic() {
    const music = this.music;
    if (!music) return;
    if (this.preferences.music && this.active && this.unlocked) music.play();
    else music.pause();
  }

  private releasePlayer(player: AudioPlayer | null) {
    if (!player) return;
    try {
      player.pause();
      player.remove();
    } catch {
      // Native player may already be gone.
    }
  }
}

export const audioManager = new WordMaizeAudioManager();
