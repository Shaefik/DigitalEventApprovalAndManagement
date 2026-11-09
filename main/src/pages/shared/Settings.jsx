import { useState } from 'react';
import { Input } from '../../components/forms/Fields';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useApp } from '../../hooks/useApp';

export default function Settings() {
  const { user, db, update, setSettings, resetDemo, logout, toast } = useApp();
  const [p, setP] = useState({ name: user.name, email: user.email });
  const [pw, setPw] = useState({ cur: '', next: '', again: '' });
  const [err, setErr] = useState({});
  const [reset, setReset] = useState(false);

  const saveProfile = (e) => { e.preventDefault(); if (!p.name.trim() || !/^\S+@\S+\.\S+$/.test(p.email)) return toast('Enter a valid name and email.', 'error'); update('users', user.id, p); toast('Profile updated.'); };
  const changePw = (e) => {
    e.preventDefault();
    const x = {};
    if (pw.cur !== user.password) x.cur = 'Current password is incorrect.';
    if (pw.next.length < 6) x.next = 'Use at least 6 characters.';
    if (pw.next !== pw.again) x.again = 'Passwords do not match.';
    setErr(x);
    if (Object.keys(x).length) return;
    update('users', user.id, { password: pw.next }); setPw({ cur: '', next: '', again: '' }); toast('Password changed.');
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card space-y-4 p-5"><h3 className="font-bold text-navy-900">Profile</h3>
        <Input label="Full name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        <Input label="Email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
        <Input label="Role" value={user.role} disabled /><button className="btn-primary">Save profile</button></form>
      <form onSubmit={changePw} className="card space-y-4 p-5"><h3 className="font-bold text-navy-900">Change password</h3>
        <Input label="Current password" type="password" value={pw.cur} error={err.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} />
        <Input label="New password" type="password" value={pw.next} error={err.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <Input label="Confirm new password" type="password" value={pw.again} error={err.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
        <button className="btn-primary">Update password</button></form>
      {user.role === 'admin' && (
        <div className="card space-y-4 p-5 lg:col-span-2"><h3 className="font-bold text-navy-900">System settings</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="College name" value={db.settings.collegeName} onChange={(e) => setSettings({ collegeName: e.target.value })} />
            <Input label="Academic year" value={db.settings.academicYear} onChange={(e) => setSettings({ academicYear: e.target.value })} />
            <Input label="Minimum OD attendance (%)" type="number" value={db.settings.odMinAttendance} onChange={(e) => setSettings({ odMinAttendance: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-indigo-600" checked={db.settings.emailAlerts} onChange={(e) => setSettings({ emailAlerts: e.target.checked })} />Send email alerts (applies once the backend is connected)</label>
          <div><button type="button" className="btn-ghost" onClick={() => setReset(true)}>Reset demo data</button></div></div>
      )}
      <div className="lg:col-span-2"><button className="btn-ghost" onClick={logout}>Logout</button></div>
      <ConfirmDialog open={reset} onClose={() => setReset(false)} confirmText="Reset" message="Restore all demo data and discard your changes?" onConfirm={resetDemo} />
    </div>
  );
}
