import { en, type Messages } from './en';
import { isLocale, type Locale } from './locales';

const catalogs: Record<Locale, Messages> = { en };

export function messagesFor(locale: Locale | string | undefined): Messages {
  return isLocale(locale) ? catalogs[locale] : catalogs.en;
}
