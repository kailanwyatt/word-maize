import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

type AudioPreferences = { music: boolean; sfx: boolean };

class WordMaizeAudioManager {
  private sfxPlayers = new Map<AudioSource, AudioPlayer>();
  private preferences: AudioPreferences = { music: true, sfx: true };
  private active = true;
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
  }

  async setAppActive(active: boolean) {
    this.active = active;
    await setIsAudioActiveAsync(active).catch(() => {});
  }

  async playSfx(source: AudioSource, volume = 0.8) {
    if (!this.preferences.sfx || !this.active) return;
    await this.configure();
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
    for (const player of this.sfxPlayers.values()) this.releasePlayer(player);
    this.sfxPlayers.clear();
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
