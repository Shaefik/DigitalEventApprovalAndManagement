import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, DoorOpen, FileText, GraduationCap, UserCog, Users, XCircle, ClipboardList } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { useApp } from '../../hooks/useApp';
import { ROLE_LABELS } from '../../utils/workflow';
import { fmtDateTime } from '../../utils/helpers';

export default function AdminDashboard() {
  const { db } = useApp();
  const reqs = db.requests.filter((r) => r.status !== 'Draft');
  const count = (s) => reqs.filter((r) => r.status === s).length;
  const faculty = db.users.filter((u) => ['tutor', 'faculty-advisor', 'hod'].includes(u.role)).length;
  const pie = [['Pending', '#f59e0b'], ['Approved', '#10b981'], ['Rejected', '#ef4444']].map(([name, color]) => ({ name, color, value: count(name) }));
  const bars = ['Pending', 'Approved', 'Rejected'].map((s) => ({ status: s, OD: reqs.filter((r) => r.type === 'od' && r.status === s).length, Bookings: reqs.filter((r) => r.type === 'booking' && r.status === s).length }));
  const activity = db.requests.flatMap((r) => [
    { at: r.createdAt, text: `${r.id} submitted (${r.data.eventName})` },
    ...r.approvals.filter((a) => a.at).map((a) => ({ at: a.at, text: `${r.id} ${a.status.toLowerCase()} by ${ROLE_LABELS[a.role]}` })),
  ]).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={db.users.length} icon={Users} tone="navy" />
        <StatCard label="Students" value={db.users.filter((u) => u.role === 'student').length} icon={GraduationCap} />
        <StatCard label="Faculty" value={faculty} icon={UserCog} />
        <StatCard label="Secretaries" value={db.users.filter((u) => u.role === 'secretary').length} icon={ClipboardList} />
        <StatCard label="OD applications" value={reqs.filter((r) => r.type === 'od').length} icon={FileText} tone="navy" />
        <StatCard label="Room bookings" value={reqs.filter((r) => r.type === 'booking').length} icon={DoorOpen} tone="navy" />
        <StatCard label="Pending approvals" value={count('Pending')} icon={Clock} tone="amber" />
        <StatCard label="Approved" value={count('Approved')} icon={CheckCircle2} tone="green" />
        <StatCard label="Rejected" value={count('Rejected')} icon={XCircle} tone="red" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5"><h3 className="mb-2 font-bold text-navy-900">Requests by status</h3>
          <ResponsiveContainer width="100%" height={260}><BarChart data={bars}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="status" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="OD" fill="#1b3270" radius={[6, 6, 0, 0]} /><Bar dataKey="Bookings" fill="#818cf8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="card p-5"><h3 className="mb-2 font-bold text-navy-900">Overall outcome</h3>
          <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{pie.map((p) => <Cell key={p.name} fill={p.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
      </div>
      <div className="card p-5"><h3 className="mb-3 font-bold text-navy-900">Recent activity</h3>
        <ul className="divide-y divide-slate-100 text-sm">{activity.map((a, i) => <li key={i} className="flex justify-between gap-3 py-2"><span>{a.text}</span><span className="shrink-0 text-xs text-slate-500">{fmtDateTime(a.at)}</span></li>)}</ul></div>
    </div>
  );
}
