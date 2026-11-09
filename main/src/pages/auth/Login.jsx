import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../hooks/useApp';
import { Input } from '../../components/forms/Fields';
import Modal from '../../components/common/Modal';
import { ROLE_LABELS } from '../../utils/workflow';

export default function Login() {
  const { user, login, createAdmin, db, toast } = useApp();
  const [tab, setTab] = useState('staff'); // staff | admin
  const [mode, setMode] = useState('login'); // login | create (admin only)
  const [f, setF] = useState({ identifier: '', password: '', name: '', username: '', remember: true });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const admin = tab === 'admin';

  const validate = () => {
    const e = {};
    if (mode === 'create') {
      if (!f.name.trim()) e.name = 'Admin name is required.';
      if (!f.username.trim()) e.username = 'Username is required.';
    } else if (!f.identifier.trim()) e.identifier = admin ? 'Username is required.' : 'Email is required.';
    else if (!admin && !/^\S+@\S+\.\S+$/.test(f.identifier)) e.identifier = 'Enter a valid email address.';
    if (f.password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErr(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    if (mode === 'create') {
      const r = await createAdmin({ name: f.name, username: f.username, password: f.password });
      setLoading(false);
      if (!r.ok) return setErr({ username: r.error });
      toast('Admin account created. You can now sign in.');
      setMode('login'); setF({ ...f, identifier: f.username, password: '' });
      return;
    }
    const r = await login({ identifier: f.identifier, password: f.password, admin, remember: f.remember });
    setLoading(false);
    if (!r.ok) setErr({ form: r.error });
  };

  const demo = db.users.filter((u) => (admin ? u.role === 'admin' : u.role !== 'admin'));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500"><GraduationCap /></div><b>{db.settings.collegeName}</b></div>
        <div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">Permissions and event approvals, tracked at every desk.</h2>
          <p className="mt-4 max-w-md text-slate-300">On-duty requests and room bookings move through the right approvers automatically, and everyone sees where a request stands.</p>
        </div>
        <p className="text-sm text-slate-400">Academic year {db.settings.academicYear}</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.form onSubmit={submit} noValidate initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-2xl font-extrabold text-navy-900">{mode === 'create' ? 'Create admin account' : 'Sign in'}</h1>
          <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            {[['staff', 'Student & Staff'], ['admin', 'Admin']].map(([k, l]) => (
              <button type="button" key={k} onClick={() => { setTab(k); setMode('login'); setErr({}); setF({ ...f, identifier: '', password: '' }); }} className={`rounded-lg py-2 ${tab === k ? 'bg-white text-navy-900 shadow' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {mode === 'create' ? (
              <>
                <Input label="Admin name" value={f.name} onChange={set('name')} error={err.name} />
                <Input label="Username" value={f.username} onChange={set('username')} error={err.username} />
              </>
            ) : (
              <Input label={admin ? 'Username' : 'Email'} type={admin ? 'text' : 'email'} value={f.identifier} onChange={set('identifier')} error={err.identifier} autoComplete="username" />
            )}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className={`input pr-10 ${err.password ? 'border-red-400' : ''}`} type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-slate-500" aria-label="Show or hide password">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {err.password && <p className="mt-1 text-xs text-red-600">{err.password}</p>}
            </div>
            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} />Remember me</label>
                <button type="button" className="font-semibold text-indigo-600" onClick={() => setForgot(true)}>Forgot password?</button>
              </div>
            )}
            {err.form && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err.form}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" size={16} />}{loading ? 'Please wait…' : mode === 'create' ? 'Create account' : 'Sign in'}</button>
            {admin && <button type="button" className="w-full text-sm font-semibold text-indigo-600" onClick={() => { setMode(mode === 'login' ? 'create' : 'login'); setErr({}); }}>{mode === 'login' ? 'Create a new admin account' : 'Back to sign in'}</button>}
          </div>

          {mode === 'login' && (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">Demo accounts: click to fill (password {admin ? 'admin123' : 'password123'})</p>
              <div className="flex flex-wrap gap-2">
                {demo.map((u) => <button type="button" key={u.id} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50" onClick={() => setF({ ...f, identifier: admin ? u.username : u.email, password: u.password })}>{ROLE_LABELS[u.role]}</button>)}
              </div>
            </div>
          )}
        </motion.form>
      </div>

      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password" footer={<button className="btn-primary" onClick={() => { toast('If the account exists, a reset link has been sent.'); setForgot(false); }}>Send reset link</button>}>
        <Input label="Registered email" type="email" placeholder="you@college.edu" />
        <p className="mt-2 text-xs text-slate-500">UI preview only. Password reset connects to the backend later.</p>
      </Modal>
    </div>
  );
}
