import TopBar from './TopBar.jsx';

// โครงหน้าฝั่งลูกค้าที่ไม่ใช่หน้าเมนู (ตะกร้า, ติดตามออเดอร์): แถบหัว + เส้นคั่นข้าวหลามตัด + เนื้อหากว้างตาม width
export default function CustomerShell({ tableId, width = 'max-w-xl', children }) {
  return (
    <div className="min-h-screen bg-paper pb-12 text-stone-950">
      <header className={`mx-auto ${width}`}>
        <TopBar tableId={tableId} />
        <div className="rule-diamond mx-4" />
      </header>
      <main className={`mx-auto ${width} px-4 py-6`}>{children}</main>
    </div>
  );
}
