import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import RequestDetails from './RequestDetails';
import { useApp } from '../../hooks/useApp';
import { canAct, stageLabel } from '../../utils/workflow';
import { fmtDate, userName } from '../../utils/helpers';

// mode: mine (own requests) | queue (requests that reached my role) | all (admin)
export default function RequestList({ type, mode }) {
  const { db, user } = useApp();
  const [status, setStatus] = useState('All');
  const [sel, setSel] = useState(null);

  const rows = useMemo(() => db.requests
    .filter((r) => r.type === type)
    .filter((r) => (mode === 'mine' ? r.applicantId === user.id : mode === 'queue' ? r.status !== 'Draft' && r.approvals.some((a) => a.role === user.role && a.status !== 'Waiting') : r.status !== 'Draft'))
    .filter((r) => status === 'All' || r.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [db.requests, type, mode, status, user]);

  const who = (r) => db.users.find((u) => u.id === r.applicantId);
  const view = { key: 'view', label: 'Details', render: (r) => (
    <button className={canAct(r, user) ? 'btn-primary !py-1' : 'btn-ghost !py-1'} onClick={() => setSel(r.id)}><Eye size={14} />{canAct(r, user) ? 'Review' : 'View'}</button>) };
  const stage = { key: 'stage', label: 'Current stage', render: (r) => stageLabel(r) };
  const st = { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> };

  let columns;
  if (type === 'od' && mode === 'mine') columns = [
    { key: 'id', label: 'Application ID' }, { key: 'ev', label: 'Event', render: (r) => r.data.eventName }, { key: 'dt', label: 'Date', render: (r) => fmtDate(r.data.date) },
    { key: 'sub', label: 'Submitted', render: (r) => fmtDate(r.createdAt) }, stage, st, view];
  else if (type === 'od') columns = [
    { key: 'id', label: 'ID' }, { key: 'nm', label: 'Student', render: (r) => who(r)?.name }, { key: 'rg', label: 'Register no.', render: (r) => who(r)?.regNo },
    { key: 'dp', label: 'Department', render: (r) => who(r)?.department }, { key: 'ev', label: 'Event', render: (r) => r.data.eventName }, { key: 'dt', label: 'Event date', render: (r) => fmtDate(r.data.date) },
    { key: 'rs', label: 'Reason', render: (r) => <span className="line-clamp-2 max-w-[200px]">{r.data.reason}</span> }, { key: 'sb', label: 'Subjects missed', render: (r) => r.data.subjects },
    { key: 'at', label: 'Attendance', render: (r) => `${r.data.attendance}%` }, { key: 'ap', label: 'Applied', render: (r) => fmtDate(r.createdAt) }, st, view];
  else if (mode === 'mine') columns = [
    { key: 'id', label: 'Booking ID' }, { key: 'ty', label: 'Activity type', render: (r) => r.data.activityType }, { key: 'ev', label: 'Event', render: (r) => r.data.eventName },
    { key: 'dt', label: 'Date', render: (r) => fmtDate(r.data.date) }, { key: 've', label: 'Venue', render: (r) => `${r.data.room}${r.data.venue ? `, ${r.data.venue}` : ''}` }, stage, st, view];
  else columns = [
    { key: 'id', label: 'Booking ID' }, { key: 'ev', label: 'Event', render: (r) => r.data.eventName }, { key: 'ty', label: 'Activity type', render: (r) => r.data.activityType },
    { key: 'sc', label: 'Secretary', render: (r) => userName(db.users, r.applicantId) }, { key: 'dt', label: 'Date', render: (r) => fmtDate(r.data.date) }, { key: 'tm', label: 'Time', render: (r) => `${r.data.start}–${r.data.end}` },
    { key: 've', label: 'Venue', render: (r) => r.data.room },
    { key: 'fa', label: 'Faculty Advisor remarks', render: (r) => r.approvals[0].remarks || '—' }, stage, st, view];

  const filter = (
    <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
      {['All', 'Pending', 'Approved', 'Rejected', ...(mode === 'mine' && type === 'booking' ? ['Draft'] : [])].map((s) => <option key={s}>{s}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={rows} filters={filter} searchText={(r) => `${r.id} ${r.data.eventName} ${who(r)?.name} ${who(r)?.regNo} ${r.status}`}
        emptyTitle={mode === 'queue' ? 'No requests have reached you yet' : 'No applications yet'} />
      {sel && <RequestDetails id={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
