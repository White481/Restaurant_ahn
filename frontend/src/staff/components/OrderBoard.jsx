import { useMemo } from 'react';
import { BOARD_COLUMNS } from '../../components/status.js';
import OrderColumn from './OrderColumn.jsx';

// กระดาน Kanban: 1 คอลัมน์ต่อ 1 สถานะที่ยังไม่จบ (มือถือเรียงลงมา, แท็บเล็ต 2 คอลัมน์, จอใหญ่ 4 คอลัมน์)
export default function OrderBoard({ orders, now, freshIds, pendingIds, onAdvance, onCancel }) {
  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.status, []]));
    for (const order of orders) groups[order.status]?.push(order);
    for (const list of Object.values(groups)) list.sort((a, b) => new Date(a.order_date) - new Date(b.order_date));
    return groups;
  }, [orders]);

  return (
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {BOARD_COLUMNS.map((column) => (
        <OrderColumn
          key={column.status}
          status={column.status}
          title={column.title}
          orders={byStatus[column.status]}
          now={now}
          freshIds={freshIds}
          pendingIds={pendingIds}
          onAdvance={onAdvance}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
