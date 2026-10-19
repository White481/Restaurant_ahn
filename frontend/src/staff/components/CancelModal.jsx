import Button from '../../ui/Button.jsx';
import Modal from '../../ui/Modal.jsx';
import { formatBaht } from '../../components/status.js';
import { useLang } from '../../i18n/LanguageContext.jsx';

export default function CancelModal({ order, onClose, onConfirm }) {
  const { t } = useLang();
  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={order ? t('cancel.title', { id: order.order_id }) : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} autoFocus>
            {t('cancel.keep')}
          </Button>
          <Button variant="dangerSolid" onClick={() => onConfirm(order)}>
            {t('cancel.confirm')}
          </Button>
        </>
      }
    >
      {order && (
        <p>
          {t('cancel.summary', { table: order.table_id, n: order.items.length, total: formatBaht(order.total_price) })}
          <br />
          {t('cancel.warn')}
        </p>
      )}
    </Modal>
  );
}
