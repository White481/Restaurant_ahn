import { STATUS_LABEL } from './status.js';

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status] || status}</span>;
}
