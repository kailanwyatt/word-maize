import { describe, expect, it } from 'vitest';
import { isLocale, LOCALES } from '../locales';
import { messagesFor } from '../messages';

describe('i18n catalogs', () => {
  it('ships English and falls back to it for unknown locales', () => {
    expect(LOCALES).toEqual(['en']);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zz')).toBe(false);
    expect(messagesFor('en').meta.languageName).toBe('English');
    expect(messagesFor('zz').splash.loading).toBe(messagesFor('en').splash.loading);
    expect(messagesFor(undefined).onboarding.welcomeTitle).toBe('Welcome to Word Maize');
  });
});
