import { Audio, AVPlaybackSource } from 'expo-av';

type AudioPreferences = { music: boolean; sfx: boolean };

class WordMaizeAudioManager {
  private music: Audio.Sound | null = null;
  private preferences: AudioPreferences = { music: true, sfx: true };
  private active = true;
  private configured = false;

  async configure() {
    if (this.configured) return;
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false, staysActiveInBackground: false, shouldDuckAndroid: true });
    this.configured = true;
  }

  async setPreferences(preferences: AudioPreferences) {
    this.preferences = preferences;
    await this.syncMusic();
  }

  async setAppActive(active: boolean) {
    this.active = active;
    await this.syncMusic();
  }

  async loadMusic(source: AVPlaybackSource) {
    await this.configure();
    await this.music?.unloadAsync().catch(() => {});
    const created = await Audio.Sound.createAsync(source, { isLooping: true, volume: 0.45, shouldPlay: false });
    this.music = created.sound;
    await this.syncMusic();
  }

  async playSfx(source: AVPlaybackSource, volume = 0.8) {
    if (!this.preferences.sfx || !this.active) return;
    await this.configure();
    const created = await Audio.Sound.createAsync(source, { volume, shouldPlay: true });
    created.sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) created.sound.unloadAsync().catch(() => {});
    });
  }

  async dispose() {
    const music = this.music;
    this.music = null;
    await music?.unloadAsync().catch(() => {});
  }

  private async syncMusic() {
    if (!this.music) return;
    if (this.preferences.music && this.active) await this.music.playAsync().catch(() => {});
    else await this.music.pauseAsync().catch(() => {});
  }
}

export const audioManager = new WordMaizeAudioManager();
