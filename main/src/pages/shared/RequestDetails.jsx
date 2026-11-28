import { useState } from 'react';
import { Printer, Award, ExternalLink } from 'lucide-react';
import { fileUrl } from '../../services/api';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import ApprovalTimeline from '../../components/approval/ApprovalTimeline';
import { Textarea } from '../../components/forms/Fields';
import { useApp } from '../../hooks/useApp';
import { canAct, ROLE_LABELS, stageLabel } from '../../utils/workflow';
import { fmtDate, fmtDateTime, userName } from '../../utils/helpers';

const Row = ({ k, v }) => (<><dt className="text-slate-500">{k}</dt><dd className="col-span-2 font-medium">{v || '—'}</dd></>);

const ProofView = ({ d }) => {
  const link = /^https?:\/\//i.test(d.proofLink || '') ? d.proofLink : null;
  const file = d.proofFile ? fileUrl(d.proofFile) : null;
  if (!link && !file) return <span className="font-normal text-slate-400">No proof attached</span>;
  return (
    <div className="space-y-2">
      {link && <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 break-all text-indigo-600 underline"><ExternalLink size={14} />{link}</a>}
      {file && <a href={file} target="_blank" rel="noopener noreferrer"><img src={file} alt="Proof screenshot" className="max-h-56 rounded-lg border border-slate-200" /></a>}
    </div>
  );
};

export default function RequestDetails({ id, onClose }) {
  const {
  db,
  user,
  decideRequest,
  submitDraft,
  resubmitRequest
} = useApp();
  const req = db.requests.find((r) => r.id === id);
  const [remarks, setRemarks] = useState('');
  const [err, setErr] = useState('');

  const [resubmitting, setResubmitting] = useState(false);

  const [editing, setEditing] = useState(false);

const [editReason, setEditReason] = useState('');

const [editRemarks, setEditRemarks] = useState('');

  if (!req) return null;
  const d = req.data;
  const applicant = db.users.find((u) => u.id === req.applicantId);
  const rejected = req.approvals.find((a) => a.status === 'Rejected');

  const handleEdit = () => {
  setEditReason(req.data?.reason || '');
  setEditRemarks(req.data?.remarks || '');
  setEditing(true);
};

const handleResubmit = async () => {
  if (resubmitting) return;

  const changes = {};

  if (req.type === 'od') {
    if (!editReason.trim()) {
      window.alert('Please enter a valid reason.');
      return;
    }

    changes.reason = editReason.trim();
    changes.remarks = editRemarks.trim();

  } else if (
    Object.hasOwn(req.data || {}, 'remarks')
  ) {
    changes.remarks = editRemarks.trim();
  }

  const confirmed = window.confirm(
    'Are you sure you want to resubmit this request?'
  );

  if (!confirmed) return;

  setResubmitting(true);

  try {
    const saved = await resubmitRequest(
      req.id,
      changes
    );

    if (saved) {
      setEditing(false);
    }

  } finally {
    setResubmitting(false);
  }
};

  const act = (decision) => {
    if (decision === 'reject' && !remarks.trim()) return setErr('A rejection reason is required.');
    decideRequest(req.id, decision, remarks.trim());
    setRemarks(''); setErr('');
  };

  return (
    <Modal open onClose={onClose} wide title={`${req.id} · ${d.eventName}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={req.status} /><span className="text-sm text-slate-500">Current stage: {stageLabel(req)}</span></div>
        <ApprovalTimeline req={req} />

        {rejected && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <b>Rejected by {rejected.byName} ({ROLE_LABELS[rejected.role]}):</b> {rejected.remarks}
          </div>
        )}

        {req.status === 'Approved' && req.type === 'booking' && (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center">
            <Award className="mx-auto text-emerald-600" />
            <p className="mt-1 text-lg font-extrabold text-emerald-800">Room booking fully approved</p>
            <p className="text-sm text-emerald-700">{d.eventName} · {d.room} · {fmtDate(d.date)}, {d.start}–{d.end}</p>
            <p className="mt-1 text-xs text-emerald-700">Approved by Principal {req.approvals.at(-1).byName} on {fmtDateTime(req.approvals.at(-1).at)}</p>
            <button className="btn-ghost no-print mt-3" onClick={() => window.print()}><Printer size={16} />Print certificate</button>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-y-2 text-sm">
          <Row k="Applicant" v={applicant ? `${applicant.name}${applicant.regNo ? ` (${applicant.regNo})` : ''}` : 'Unknown'} />
          <Row k="Department" v={applicant?.department} />
          <Row k="Submitted" v={fmtDateTime(req.createdAt)} />
          {req.type === 'od' ? (<>
            <Row k="Event date" v={fmtDate(d.date)} /><Row k="Reason" v={d.reason} /><Row k="Subjects missed" v={d.subjects} />
            <Row k="Attendance" v={`${d.attendance}%`} /><Row k="Remarks" v={d.remarks} />
            <Row k="Proof" v={<ProofView d={d} />} />
          </>) : (<>
            <Row k="Activity type" v={d.activityType} /><Row k={req.kind === 'club' ? 'Club' : 'Association'} v={d.groupName} />
            <Row k="Description" v={d.description} /><Row k="Date & time" v={`${fmtDate(d.date)}, ${d.start} – ${d.end}`} />
            <Row k="Participants" v={d.participants} /><Row k="Room" v={d.room} /><Row k="Preferred venue" v={d.venue} />
            <Row k="Equipment" v={d.equipment?.join(', ')} /><Row k="Additional" v={d.additional} /><Row k="Contact" v={d.contact} />
          </>)}
        </dl>

        <div>
          <h4 className="mb-2 text-sm font-bold text-navy-900">Approval history</h4>
          <ul className="space-y-2 text-sm">
            {req.approvals.filter((a) => a.at).map((a) => (
              <li key={a.role} className="rounded-lg bg-slate-50 p-2"><b>{ROLE_LABELS[a.role]}</b> ({a.byName}) <StatusBadge status={a.status} /> <span className="text-xs text-slate-500">{fmtDateTime(a.at)}</span>{a.remarks && <p className="mt-1 text-slate-600">“{a.remarks}”</p>}</li>
            ))}
            {!req.approvals.some((a) => a.at) && <li className="text-slate-500">No decisions yet.</li>}
          </ul>
        </div>

        {req.status === 'Draft' && req.applicantId === user.id && <button className="btn-primary" onClick={() => submitDraft(req.id)}>Submit request</button>}

        {/* Edit and resubmit rejected request */}

{req.status === 'Rejected' &&
  req.applicantId === user.id && (

  <div className="no-print rounded-xl border border-amber-200 bg-amber-50 p-4">

    <h4 className="font-bold text-amber-800">
      Edit & Resubmit Request
    </h4>

    <p className="mt-1 text-sm text-amber-700">
      Correct your request details before
      resubmitting to the rejecting authority.
      Previous approvals will be preserved.
    </p>

    {!editing ? (

      <button
        type="button"
        className="btn-primary mt-3"
        onClick={handleEdit}
      >
        Edit & Resubmit
      </button>

    ) : (

      <div className="mt-4 space-y-4">

        {req.type === 'od' && (

          <div>
            <label className="block text-sm font-medium mb-1">
              Reason for OD
            </label>

            <textarea
              className="w-full rounded-lg border p-3"
              rows={4}
              maxLength={2000}
              value={editReason}
              disabled={resubmitting}
              onChange={(e) =>
                setEditReason(e.target.value)
              }
              placeholder="Enter corrected reason"
            />
          </div>

        )}

        {(req.type === 'od' ||
          Object.hasOwn(req.data || {}, 'remarks')) && (

          <div>
            <label className="block text-sm font-medium mb-1">
              Applicant Remarks
            </label>

            <textarea
              className="w-full rounded-lg border p-3"
              rows={3}
              maxLength={2000}
              value={editRemarks}
              disabled={resubmitting}
              onChange={(e) =>
                setEditRemarks(e.target.value)
              }
              placeholder="Enter additional remarks"
            />
          </div>

        )}

        {req.type !== 'od' &&
          !Object.hasOwn(req.data || {}, 'remarks') && (
            <p className="text-sm text-amber-700">
              Editing is not available for this
              request yet. You can resubmit it
              without changes.
            </p>
        )}

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            className="btn-primary"
            onClick={handleResubmit}
            disabled={resubmitting}
          >
            {resubmitting
              ? 'Resubmitting...'
              : 'Save & Resubmit'}
          </button>

          <button
            type="button"
            className="rounded-lg border px-4 py-2"
            disabled={resubmitting}
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>

        </div>

      </div>

    )}

  </div>

)}
{req.status === 'Rejected' &&
  req.applicantId === user.id && (
    <div className="no-print rounded-xl border border-amber-200 bg-amber-50 p-4">

      <h4 className="font-bold text-amber-800">
        Resubmit Request
      </h4>

      <p className="mt-1 text-sm text-amber-700">
        Your request was rejected. You can resubmit
        it to the authority that rejected it.
        Previous approvals will be preserved.
      </p>

      <button
        type="button"
        className="btn-primary mt-3"
        onClick={handleResubmit}
        disabled={resubmitting}
      >
        {resubmitting
          ? 'Resubmitting...'
          : 'Resubmit Request'}
      </button>

    </div>
)}

        {canAct(req, user) && (
          <div className="no-print rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <Textarea label="Remarks" rows={2} value={remarks} onChange={(e) => { setRemarks(e.target.value); setErr(''); }} error={err} placeholder="Required when rejecting" />
            <div className="mt-3 flex gap-2"><button className="btn-success" onClick={() => act('approve')}>Approve &amp; forward</button><button className="btn-danger" onClick={() => act('reject')}>Reject</button></div>
          </div>
        )}
      </div>
    </Modal>
  );
}
