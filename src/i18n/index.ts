import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { uk } from './locales/uk';
import { en } from './locales/en';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof uk };
  }
}

i18next.use(initReactI18next).init({
  lng: (localStorage.getItem('lang') as 'uk' | 'en') ?? 'uk',
  fallbackLng: 'uk',
  resources: {
    uk: { translation: uk },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
});
