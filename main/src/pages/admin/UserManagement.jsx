import { useState } from 'react';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { Input, Select } from '../../components/forms/Fields';
import { useApp } from '../../hooks/useApp';
import { ROLE_LABELS } from '../../utils/workflow';
import { uid } from '../../utils/helpers';

const blank = { id: '', name: '', email: '', username: '', regNo: '', department: '', designation: '', role: 'student', password: '', active: true };

export default function UserManagement() {
  const { db, user, saveUser, remove, update, toast } = useApp();
  const [role, setRole] = useState('All');
  const [dept, setDept] = useState('All');
  const [form, setForm] = useState(null); // { u, oldId }
  const [del, setDel] = useState(null);
  const [err, setErr] = useState({});

  const rows = db.users.filter((u) => (role === 'All' || u.role === role) && (dept === 'All' || u.department === dept));
  const set = (k) => (e) => setForm({ ...form, u: { ...form.u, [k]: e.target.value } });

  const save = () => {
    const u = form.u, x = {};
    if (!u.name.trim()) x.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(u.email)) x.email = 'Enter a valid email.';
    if (!u.department) x.department = 'Select a department.';
    if (u.role === 'student' && !u.regNo.trim()) x.regNo = 'Register number is required for students.';
    if (!form.oldId && u.password.length < 6) x.password = 'Password must be at least 6 characters.';
    setErr(x);
    if (Object.keys(x).length) return;
    const r = saveUser({ ...u, username: u.username || u.email.split('@')[0] }, form.oldId);
    if (!r.ok) return setErr({ id: r.error });
    toast(form.oldId ? 'User updated.' : 'User created.');
    setForm(null);
  };

  const cols = [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Name', render: (u) => <div><b>{u.name}</b><p className="text-xs text-slate-500">{u.email}</p></div> },
    { key: 'username', label: 'Username' }, { key: 'regNo', label: 'Reg. no.', render: (u) => u.regNo || '—' }, { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role', render: (u) => ROLE_LABELS[u.role] },
    { key: 'active', label: 'Status', render: (u) => <button onClick={() => { if (u.id === user.id) return toast('You cannot deactivate your own account.', 'error'); update('users', u.id, { active: !u.active }); }}><StatusBadge status={u.active ? 'Active' : 'Inactive'} /></button> },
    { key: 'act', label: 'Actions', render: (u) => (
      <div className="flex gap-1">
        <button className="btn-ghost !p-2" title="Edit" onClick={() => { setErr({}); setForm({ u: { ...u, password: '' }, oldId: u.id }); }}><Pencil size={14} /></button>
        <button className="btn-ghost !p-2" title="Reset password" onClick={() => { update('users', u.id, { password: 'Welcome@123' }); toast(`Password for ${u.name} reset to Welcome@123.`); }}><KeyRound size={14} /></button>
        <button className="btn-ghost !p-2 text-red-600" title="Delete" onClick={() => u.id === user.id ? toast('You cannot delete your own account.', 'error') : setDel(u)}><Trash2 size={14} /></button>
      </div>) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button className="btn-primary" onClick={() => { setErr({}); setForm({ u: { ...blank, id: uid('U') }, oldId: null }); }}><Plus size={16} />Add user</button></div>
      <DataTable columns={cols} rows={rows} searchText={(u) => `${u.id} ${u.name} ${u.email} ${u.username} ${u.regNo}`} filters={<>
        <select className="input !w-auto" value={role} onChange={(e) => setRole(e.target.value)}><option value="All">All roles</option>{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="input !w-auto" value={dept} onChange={(e) => setDept(e.target.value)}><option>All</option>{db.departments.map((d) => <option key={d.id}>{d.code}</option>)}</select></>} />

      <Modal open={!!form} onClose={() => setForm(null)} wide title={form?.oldId ? 'Edit user' : 'Add user'} footer={<><button className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save user</button></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="User ID" value={form.u.id} onChange={set('id')} error={err.id} />
            <Input label="Full name" required value={form.u.name} onChange={set('name')} error={err.name} />
            <Input label="Email" required type="email" value={form.u.email} onChange={set('email')} error={err.email} />
            <Input label="Username" value={form.u.username} onChange={set('username')} />
            <Input label="Register number" value={form.u.regNo} onChange={set('regNo')} error={err.regNo} />
            <Select label="Department" required value={form.u.department} onChange={set('department')} error={err.department} options={db.departments.map((d) => d.code)} />
            <Input label="Designation" value={form.u.designation} onChange={set('designation')} />
            <Select label="Assigned role" required value={form.u.role} onChange={set('role')} placeholder="" options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
            <Input label={form.oldId ? 'New password (leave blank to keep)' : 'Password'} type="password" value={form.u.password} error={err.password} onChange={set('password')} />
            <Select label="Account status" value={form.u.active ? 'Active' : 'Inactive'} onChange={(e) => setForm({ ...form, u: { ...form.u, active: e.target.value === 'Active' } })} placeholder="" options={['Active', 'Inactive']} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} message={`Delete ${del?.name}? This cannot be undone.`} onConfirm={() => { remove('users', del.id); toast('User deleted.'); }} />
    </div>
  );
}
