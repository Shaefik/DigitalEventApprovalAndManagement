const STYLES = {
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Waiting: 'bg-slate-100 text-slate-600 ring-slate-200',
  Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
};
export default function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[status] || STYLES.Waiting}`}>{status === 'Waiting' ? 'Not yet reached' : status}</span>;
}
