import { useGameStore } from '../store/GameStore';
import { messagesFor } from './messages';
import type { Messages } from './en';

export function useMessages(): Messages {
  const locale = useGameStore().save.settings.language;
  return messagesFor(locale);
}

export { messagesFor } from './messages';
export { isLocale, LOCALES } from './locales';
export type { Locale } from './locales';
export type { Messages } from './en';
