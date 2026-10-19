import { messages } from './messages.js';

export const LANGS = ['th', 'en'];
export const DEFAULT_LANG = 'th';
const LANG_KEY = 'oms_lang';

export function getStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return LANGS.includes(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function setStoredLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // เบราว์เซอร์ไม่ให้เก็บค่า: ใช้ได้แค่ในรอบนี้
  }
}

// แปลข้อความ: ไม่พบคำในภาษาที่เลือกจะถอยไปใช้ภาษาไทย แล้วค่อยแสดงชื่อ key (ช่วยให้เห็นว่าลืมแปลตรงไหน)
// เอกพจน์: ถ้า params.n === 1 และมี key + '_one' (เช่น 'cart.open_one' = "1 item") จะใช้ข้อความนั้น (ภาษาไทยไม่แยกเอกพจน์/พหูพจน์)
export function translate(lang, key, params) {
  const singular = params && params.n === 1 ? messages[lang]?.[`${key}_one`] : undefined;
  const text = singular ?? messages[lang]?.[key] ?? messages[DEFAULT_LANG][key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match));
}

// ชื่อเมนูตามภาษา: อังกฤษใช้ item_name_en ถ้ามี ไม่มีก็ใช้ชื่อไทย
export function localizedName(item, lang) {
  return (lang === 'en' && item.item_name_en) || item.item_name;
}

// วันที่/เวลา: ไทยใช้ปฏิทินพุทธ (พ.ศ.) ตามธรรมเนียมใบเสร็จ, อังกฤษใช้ค.ศ. แบบ 24 ชั่วโมง
export function formatDateTime(date, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'th-TH-u-ca-buddhist', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(date));
}

export function formatTime(date, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date));
}
