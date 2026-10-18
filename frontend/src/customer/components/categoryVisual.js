// ภาพแทนของเมนูที่ยังไม่มีรูปจริง (พื้นไล่สี + อีโมจิตามหมวด) ให้หน้าไม่โหวง
// เมื่อเพิ่มคอลัมน์ image_url ใน DB แล้ว MenuCard จะใช้รูปจริงก่อนโดยอัตโนมัติ
const RULES = [
  { match: /main|ข้าว|จานหลัก|อาหารจานเดียว/i, emoji: '🍛', bg: 'from-amber-100 to-orange-200' },
  { match: /soup|ซุป|ต้ม|แกง/i, emoji: '🍲', bg: 'from-red-100 to-orange-200' },
  { match: /salad|สลัด|ยำ|ส้มตำ/i, emoji: '🥗', bg: 'from-lime-100 to-green-200' },
  { match: /appetizer|starter|ทานเล่น|ของทอด/i, emoji: '🍗', bg: 'from-yellow-100 to-amber-200' },
  { match: /drink|beverage|เครื่องดื่ม|น้ำ/i, emoji: '🧋', bg: 'from-sky-100 to-cyan-200' },
  { match: /dessert|ขนม|ของหวาน|หวาน/i, emoji: '🍨', bg: 'from-pink-100 to-rose-200' }
];

const DEFAULT = { emoji: '🍽️', bg: 'from-stone-100 to-stone-200' };

export function visualFor(category) {
  return RULES.find((rule) => rule.match.test(category || '')) || DEFAULT;
}
