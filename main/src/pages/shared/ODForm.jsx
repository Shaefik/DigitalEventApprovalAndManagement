import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Textarea } from '../../components/forms/Fields';
import { useApp } from '../../hooks/useApp';

export default function ODForm() {
  const { db, user, createRequest } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ eventName: '', reason: '', date: '', subjects: '', attendance: '', remarks: '' });
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (!f.eventName) x.eventName = 'Select an event or activity.';
    if (f.reason.trim().length < 10) x.reason = 'Describe the reason in at least 10 characters.';
    if (!f.date) x.date = 'Choose the event date.';
    if (!f.subjects.trim()) x.subjects = 'List the subjects you will miss.';
    if (f.attendance === '' || f.attendance < 0 || f.attendance > 100) x.attendance = 'Enter a percentage between 0 and 100.';
    setErr(x);
    if (Object.keys(x).length) return;
    createRequest({ type: 'od', data: { ...f, attendance: Number(f.attendance) } });
    nav(`/${user.role}/od-list`);
  };

  const low = f.attendance !== '' && Number(f.attendance) < db.settings.odMinAttendance;
  return (
    <form onSubmit={submit} noValidate className="card mx-auto max-w-3xl space-y-4 p-6">
      <div><h2 className="text-xl font-bold text-navy-900">Apply for On-Duty (OD)</h2><p className="text-sm text-slate-500">Your request goes to the Faculty Advisor, then the Tutor.</p></div>
      <Select label="Event / activity name" required value={f.eventName} onChange={set('eventName')} error={err.eventName} options={db.events.filter((x) => x.active).map((x) => x.name)} />
      <Textarea label="Reason for requesting OD" required value={f.reason} onChange={set('reason')} error={err.reason} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Date" type="date" required value={f.date} onChange={set('date')} error={err.date} />
        <Input label="Current class attendance (%)" type="number" required value={f.attendance} onChange={set('attendance')} error={err.attendance} />
      </div>
      {low && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Attendance is below {db.settings.odMinAttendance}%. Your approvers may reject this request.</p>}
      <Input label="Subject(s) that will be missed" required placeholder="e.g. DBMS, Operating Systems" value={f.subjects} onChange={set('subjects')} error={err.subjects} />
      <Textarea label="Additional remarks" rows={2} value={f.remarks} onChange={set('remarks')} />
      <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => nav(-1)}>Cancel</button><button className="btn-primary">Submit application</button></div>
    </form>
  );
}
