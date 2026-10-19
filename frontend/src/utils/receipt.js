// คำนวณตัวเลขบนใบเสร็จ/หน้ารับชำระเงิน ทำเป็น "สตางค์" (จำนวนเต็ม) เพื่อเลี่ยงทศนิยมคลาดเคลื่อนของ floating point

export const toCents = (value) => Math.round(Number(value) * 100);

// ราคารวม VAT แล้ว -> แยกมูลค่าก่อน VAT กับ VAT (เช่น 270 -> 252.34 + 17.66)
export function vatBreakdown(total, rate) {
  const totalCents = toCents(total);
  const netCents = Math.round(totalCents / (1 + rate));
  return { net: netCents / 100, vat: (totalCents - netCents) / 100, total: totalCents / 100 };
}

// เงินทอน (null = ยังไม่พอ/ไม่ได้กรอก)
export function changeFor(received, total) {
  const receivedCents = toCents(received);
  if (!Number.isFinite(receivedCents) || receivedCents < toCents(total)) return null;
  return (receivedCents - toCents(total)) / 100;
}

// ปุ่มลัดจำนวนเงิน: พอดี และปัดขึ้นเป็นหลัก 100 / 500 / 1,000 (ไม่ซ้ำ ไม่น้อยกว่ายอด)
export function cashSuggestions(total) {
  const values = new Set([Number(total)]);
  for (const step of [100, 500, 1000]) values.add(Math.ceil(Number(total) / step) * step);
  return [...values].filter((v) => v >= Number(total)).sort((a, b) => a - b).slice(0, 4);
}

// ตัวเลขเงินบนใบเสร็จ: 1,234.50
export const money = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
