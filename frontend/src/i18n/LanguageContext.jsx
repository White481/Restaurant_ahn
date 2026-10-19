import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, getStoredLang, setStoredLang, translate } from './index.js';

const LanguageContext = createContext(null);

// เก็บภาษาที่เลือกไว้ใน localStorage (จำข้ามการรีเฟรช) และตั้งค่า <html lang> ให้ตรงภาษา
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return;
    setStoredLang(next);
    setLangState(next);
  }, []);

  const t = useCallback((key, params) => translate(lang, key, params), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
