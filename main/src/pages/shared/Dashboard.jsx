import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, FileText, XCircle, FilePlus2, DoorOpen } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import AdminDashboard from '../admin/AdminDashboard';
import { useApp } from '../../hooks/useApp';
import { ROLE_LABELS, stageLabel } from '../../utils/workflow';
import { fmtDate } from '../../utils/helpers';

export default function Dashboard() {
  const { db, user } = useApp();
  if (user.role === 'admin') return <AdminDashboard />;

  const own = ['student', 'secretary'].includes(user.role);
  const mine = db.requests.filter((r) => (own ? r.applicantId === user.id : r.status !== 'Draft' && r.approvals.some((a) => a.role === user.role && a.status !== 'Waiting')));
  const mineAct = (s) => mine.filter((r) => (own ? r.status === s : r.approvals.find((a) => a.role === user.role)?.status === s));
  const recent = [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const noun = user.role === 'tutor' ? 'OD requests' : own ? 'applications' : 'requests';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-extrabold text-navy-900">Welcome, {user.name.split(' ')[0]}</h2><p className="text-sm text-slate-500">{ROLE_LABELS[user.role]} · {user.department}</p></div>
        <div className="flex gap-2">
          {own && <Link to={`/${user.role}/od-new`} className="btn-primary"><FilePlus2 size={16} />Quick apply OD</Link>}
          {user.role === 'secretary' && <Link to={`/${user.role}/bk-new`} className="btn-ghost"><DoorOpen size={16} />New booking</Link>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Total ${noun}`} value={mine.length} icon={FileText} tone="navy" />
        <StatCard label={own ? 'Approved' : 'Approved by me'} value={mineAct('Approved').length} icon={CheckCircle2} tone="green" />
        <StatCard label={own ? 'Pending' : 'Awaiting my action'} value={own ? mineAct('Pending').length : mine.filter((r) => r.status === 'Pending' && r.approvals.find((a) => a.role === user.role).status === 'Pending').length} icon={Clock} tone="amber" />
        <StatCard label={own ? 'Rejected' : 'Rejected by me'} value={mineAct('Rejected').length} icon={XCircle} tone="red" />
      </div>
      <div className="card p-5">
        <h3 className="mb-3 font-bold text-navy-900">Recent {noun}</h3>
        {recent.length === 0 ? <EmptyState title="No activity yet" hint={own ? 'Submit your first request to see it here.' : 'Requests will appear when they reach you.'} /> : (
          <ul className="divide-y divide-slate-100">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div><b>{r.id}</b> · {r.data.eventName}<p className="text-xs text-slate-500">{fmtDate(r.createdAt)} · Stage: {stageLabel(r)}</p></div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
