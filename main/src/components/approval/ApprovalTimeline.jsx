import { useState } from 'react';
import { Check, X, Clock, Minus, ChevronRight, ChevronDown } from 'lucide-react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { useApp } from '../../hooks/useApp';
import { ROLE_LABELS } from '../../utils/workflow';
import { fmtDate, fmtTime, userName } from '../../utils/helpers';

const TONE = {
  Approved: 'bg-emerald-500 text-white border-emerald-500',
  Pending: 'bg-amber-400 text-white border-amber-400',
  Rejected: 'bg-red-500 text-white border-red-500',
  Waiting: 'bg-slate-200 text-slate-500 border-slate-200',
};
const ICON = { Approved: Check, Pending: Clock, Rejected: X, Waiting: Minus };

// Stages are built from req.approvals, so the timeline adapts to OD / Association / Club flows automatically.
export default function ApprovalTimeline({ req }) {
  const { db } = useApp();
  const [open, setOpen] = useState(null);
  const applicant = userName(db.users, req.applicantId);
  const finalStatus = req.status === 'Approved' ? 'Approved' : 'Waiting';
  const stages = [
    ...req.approvals.map((a) => ({ ...a, label: ROLE_LABELS[a.role], approver: a.byName || db.users.find((u) => u.role === a.role)?.name })),
    { role: 'final', label: req.type === 'od' ? 'Student Notified' : 'Fully Approved', status: finalStatus, final: true },
  ];

  return (
    <>
      <div className="flex flex-col items-stretch gap-1 md:flex-row md:items-center">
        {stages.map((s, i) => {
          const Icon = ICON[s.status];
          return (
            <div key={s.role} className="flex flex-col items-stretch gap-1 md:flex-1 md:flex-row md:items-center">
              <button onClick={() => setOpen(s)} className={`flex flex-1 items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 ${s.status === 'Waiting' ? 'border-slate-200' : s.status === 'Approved' ? 'border-emerald-300' : s.status === 'Pending' ? 'border-amber-300' : 'border-red-300'}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${TONE[s.status]}`}><Icon size={16} /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-navy-900">{s.label}</span><span className="block text-xs text-slate-500">{s.status === 'Waiting' ? 'Not yet reached' : s.status}</span></span>
              </button>
              {i < stages.length - 1 && (<><ChevronRight className="hidden shrink-0 text-slate-300 md:block" size={18} /><ChevronDown className="mx-auto text-slate-300 md:hidden" size={18} /></>)}
            </div>
          );
        })}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.label} – ${req.id}` : ''}>
        {open && (open.final ? (
          <div className="space-y-3 text-sm">
            <StatusBadge status={open.status} />
            <p>{open.status === 'Approved' ? (req.type === 'od' ? `${applicant} has been notified that the OD is fully approved.` : 'Booking fully approved. The room is confirmed.') : req.status === 'Rejected' ? 'Workflow stopped because the request was rejected.' : 'Awaiting completion of all approval stages.'}</p>
          </div>
        ) : (
          <dl className="grid grid-cols-3 gap-y-3 text-sm">
            <dt className="text-slate-500">Approver</dt><dd className="col-span-2 font-semibold">{open.approver || '—'}</dd>
            <dt className="text-slate-500">Designation</dt><dd className="col-span-2">{ROLE_LABELS[open.role]}</dd>
            <dt className="text-slate-500">Status</dt><dd className="col-span-2"><StatusBadge status={open.status} /></dd>
            <dt className="text-slate-500">Date</dt><dd className="col-span-2">{fmtDate(open.at)}</dd>
            <dt className="text-slate-500">Time</dt><dd className="col-span-2">{fmtTime(open.at)}</dd>
            <dt className="text-slate-500">Remarks</dt><dd className="col-span-2">{open.status === 'Rejected' ? '—' : open.remarks || '—'}</dd>
            {open.status === 'Rejected' && (<><dt className="text-red-600">Rejection reason</dt><dd className="col-span-2 rounded-lg bg-red-50 p-2 text-red-700">{open.remarks}</dd></>)}
          </dl>
        ))}
      </Modal>
    </>
  );
}
