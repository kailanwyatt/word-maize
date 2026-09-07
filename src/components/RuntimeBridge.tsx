import { useEffect } from 'react';
import { AppState } from 'react-native';
import { audioManager } from '../audio/AudioManager';
import { useGameStore } from '../store/GameStore';

export function RuntimeBridge() {
  const { save } = useGameStore();

  useEffect(() => {
    audioManager.configure().catch(() => {});
    const subscription = AppState.addEventListener('change', state => {
      audioManager.setAppActive(state === 'active').catch(() => {});
    });
    return () => {
      subscription.remove();
      audioManager.dispose().catch(() => {});
    };
  }, []);

  useEffect(() => {
    audioManager.setPreferences({ music: save.settings.music, sfx: save.settings.sfx }).catch(() => {});
  }, [save.settings.music, save.settings.sfx]);

  return null;
}
