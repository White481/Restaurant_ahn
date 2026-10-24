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
        <div className="flex flex-col gap-3">
          <p>{t('cancel.summary', { table: order.table_id, n: order.items.length, total: formatBaht(order.total_price) })}</p>
          <p className="rounded-lg bg-chili-100 px-3 py-2 text-sm font-medium text-chili-700 dark:bg-chili-900 dark:text-chili-300">{t('cancel.warn')}</p>
        </div>
      )}
    </Modal>
  );
}
