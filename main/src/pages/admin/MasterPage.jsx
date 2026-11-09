import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { CheckGroup, Input } from '../../components/forms/Fields';
import { useApp } from '../../hooks/useApp';

// One generic CRUD screen drives Clubs, Associations, Events, Departments and Rooms.
export const MASTERS = {
  clubs: { title: 'Club', col: 'clubs', active: true, fields: [{ key: 'name', label: 'Club name', required: true }] },
  associations: { title: 'Association', col: 'associations', fields: [{ key: 'name', label: 'Association name', required: true }] },
  events: { title: 'Event activity', col: 'events', active: true, fields: [{ key: 'name', label: 'Activity name', required: true }] },
  departments: { title: 'Department', col: 'departments', fields: [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Department name', required: true }] },
  rooms: { title: 'Room', col: 'rooms', active: true, fields: [{ key: 'name', label: 'Room name', required: true }, { key: 'capacity', label: 'Capacity', type: 'number', required: true }, { key: 'equipment', label: 'Available equipment', type: 'check', options: ['Projector', 'Microphone', 'Speakers', 'Whiteboard', 'Stage Lights', 'Laptop'] }] },
};

export default function MasterPage({ type }) {
  const cfg = MASTERS[type];
  const { db, add, update, remove, toast } = useApp();
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [err, setErr] = useState({});
  const list = db[cfg.col];
  const first = cfg.fields[0].key;

  const save = () => {
    const x = {};
    cfg.fields.forEach((f) => { if (f.required && !String(form[f.key] ?? '').trim()) x[f.key] = 'Required.'; });
    if (!x[first] && list.some((i) => i.id !== form.id && String(i[first]).toLowerCase() === String(form[first]).trim().toLowerCase())) x[first] = 'Already exists.';
    if (cfg.col === 'rooms' && form.capacity < 1) x.capacity = 'Capacity must be at least 1.';
    setErr(x);
    if (Object.keys(x).length) return;
    form.id ? update(cfg.col, form.id, form) : add(cfg.col, { ...form, ...(cfg.active ? { active: true } : {}) });
    toast(`${cfg.title} ${form.id ? 'updated' : 'added'}.`);
    setForm(null);
  };

  const columns = [
    ...cfg.fields.map((f) => ({ key: f.key, label: f.label, render: (r) => (Array.isArray(r[f.key]) ? r[f.key].join(', ') || '—' : r[f.key]) })),
    ...(cfg.active ? [{ key: 'active', label: 'Status', render: (r) => <button onClick={() => update(cfg.col, r.id, { active: !r.active })} title="Toggle status"><StatusBadge status={r.active ? 'Active' : 'Inactive'} /></button> }] : []),
    { key: 'act', label: 'Actions', render: (r) => (
      <div className="flex gap-1"><button className="btn-ghost !p-2" aria-label="Edit" onClick={() => { setErr({}); setForm({ ...r }); }}><Pencil size={14} /></button>
        <button className="btn-ghost !p-2 text-red-600" aria-label="Delete" onClick={() => setDel(r)}><Trash2 size={14} /></button></div>) },
  ];
  const empty = Object.fromEntries(cfg.fields.map((f) => [f.key, f.type === 'check' ? [] : '']));

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button className="btn-primary" onClick={() => { setErr({}); setForm(empty); }}><Plus size={16} />Add {cfg.title.toLowerCase()}</button></div>
      <DataTable columns={columns} rows={list} />
      <Modal open={!!form} onClose={() => setForm(null)} title={`${form?.id ? 'Edit' : 'Add'} ${cfg.title.toLowerCase()}`} footer={<><button className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        {form && <div className="space-y-4">{cfg.fields.map((f) => f.type === 'check'
          ? <CheckGroup key={f.key} label={f.label} options={f.options} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
          : <Input key={f.key} label={f.label} required={f.required} type={f.type || 'text'} value={form[f.key]} error={err[f.key]} onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} />)}</div>}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} message={`Delete "${del?.[first]}"? It will disappear from all dropdowns.`} onConfirm={() => { remove(cfg.col, del.id); toast(`${cfg.title} deleted.`); }} />
    </div>
  );
}
