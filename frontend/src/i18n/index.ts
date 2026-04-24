import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { api } from '../api';
import { en } from './locales/en';
import { it } from './locales/it';

export type Lang = 'it' | 'en';

export const LANG_STORAGE_KEY = 'u3d_lang';
const DEFAULT_LANG: Lang = 'it';

function normalize(raw: string | null | undefined): Lang {
  const code = (raw || '').trim().toLowerCase().split(/[-_]/)[0];
  return code === 'en' || code === 'it' ? code : DEFAULT_LANG;
}

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored) return normalize(stored);
  } catch { /* ignore */ }
  return DEFAULT_LANG;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    lng: initialLang(),
    fallbackLng: DEFAULT_LANG,
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export function currentLang(): Lang {
  return normalize(i18n.language);
}

// Central mutator: switch UI locale + persist + notify backend.
export async function setLang(next: Lang) {
  const code = normalize(next);
  await i18n.changeLanguage(code);
  try { localStorage.setItem(LANG_STORAGE_KEY, code); } catch { /* ignore */ }
  try {
    await api.put('/api/settings', { U3DP_LANG: code });
  } catch { /* non-fatal — header on each fetch still carries lang */ }
}

export default i18n;
