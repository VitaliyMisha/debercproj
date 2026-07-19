import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { uk } from './locales/uk';

/** localStorage key for the chosen language — shared with App. */
export const LANG_STORAGE_KEY = 'lang';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof uk };
  }
}

i18next.use(initReactI18next).init({
  lng: (localStorage.getItem(LANG_STORAGE_KEY) as 'uk' | 'en') ?? 'uk',
  fallbackLng: 'uk',
  resources: {
    uk: { translation: uk },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
});
