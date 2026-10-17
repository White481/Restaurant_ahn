import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Context = ที่เก็บ state กลางที่ทุกหน้าเรียกใช้ได้ (ตะกร้า + หมายเลขโต๊ะ) โดยไม่ต้องส่ง props ต่อกันหลายชั้น
const CartContext = createContext(null);
const CART_KEY = 'oms_cart';
const TABLE_KEY = 'oms_table';

function load(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => load(CART_KEY, []));
  const [tableId, setTableId] = useState(() => load(TABLE_KEY, null));

  // sessionStorage: refresh หน้าแล้วตะกร้าไม่หาย แต่ปิดแท็บแล้วหาย
  useEffect(() => sessionStorage.setItem(CART_KEY, JSON.stringify(items)), [items]);
  useEffect(() => sessionStorage.setItem(TABLE_KEY, JSON.stringify(tableId)), [tableId]);

  const addItem = useCallback((menu) => {
    setItems((prev) => {
      const found = prev.find((i) => i.menu_item_id === menu.menu_item_id);
      if (found) {
        return prev.map((i) =>
          i.menu_item_id === menu.menu_item_id ? { ...i, quantity: Math.min(i.quantity + 1, 99) } : i
        );
      }
      return [
        ...prev,
        { menu_item_id: menu.menu_item_id, item_name: menu.item_name, price: Number(menu.price), quantity: 1 }
      ];
    });
  }, []);

  const setQuantity = useCallback((menuItemId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.menu_item_id !== menuItemId)
        : prev.map((i) => (i.menu_item_id === menuItemId ? { ...i, quantity: Math.min(quantity, 99) } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  // คิดเป็นสตางค์ (integer) ก่อน เพื่อเลี่ยงทศนิยมคลาดเคลื่อน เหมือนฝั่ง backend
  const totalPrice = items.reduce((sum, i) => sum + Math.round(i.price * 100) * i.quantity, 0) / 100;

  const value = useMemo(
    () => ({ items, tableId, setTableId, addItem, setQuantity, clear, totalQty, totalPrice }),
    [items, tableId, addItem, setQuantity, clear, totalQty, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
