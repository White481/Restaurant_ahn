import Button from '../../ui/Button.jsx';
import Modal from '../../ui/Modal.jsx';
import { formatBaht } from '../../components/status.js';

export default function CancelModal({ order, onClose, onConfirm }) {
  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={order ? `ยกเลิกออเดอร์ #${order.order_id}?` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} autoFocus>
            ไม่ยกเลิก
          </Button>
          <Button variant="dangerSolid" onClick={() => onConfirm(order)}>
            ยกเลิกออเดอร์
          </Button>
        </>
      }
    >
      {order && (
        <p>
          โต๊ะ {order.table_id} · {order.items.length} รายการ · {formatBaht(order.total_price)}
          <br />
          ลูกค้าจะเห็นสถานะ "ยกเลิก" ทันที และไม่มีปุ่มย้อนกลับในหน้านี้
        </p>
      )}
    </Modal>
  );
}
