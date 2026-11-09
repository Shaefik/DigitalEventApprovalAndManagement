import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckGroup, Input, Select, Textarea } from '../../components/forms/Fields';
import { useApp } from '../../hooks/useApp';

const EQUIP = ['Projector', 'Microphone', 'Speakers', 'Whiteboard', 'Stage Lights', 'Laptop'];
const blank = { kind: 'association', groupName: '', eventName: '', description: '', date: '', start: '', end: '', participants: '', room: '', venue: '', equipment: [], additional: '', contact: '' };

export default function BookingForm() {
  const { db, user, createRequest } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState(blank);
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const room = db.rooms.find((r) => r.name === f.room);

  const send = (draft) => (e) => {
    e.preventDefault();
    const x = {};
    if (!f.groupName) x.groupName = f.kind === 'club' ? 'Select a club.' : 'Enter the association name.';
    if (!f.eventName.trim()) x.eventName = 'Event name is required.';
    if (!draft) {
      if (!f.description.trim()) x.description = 'Add a short description.';
      if (!f.date) x.date = 'Choose the event date.';
      if (!f.start) x.start = 'Required.';
      if (!f.end) x.end = 'Required.';
      else if (f.start && f.end <= f.start) x.end = 'End time must be after start time.';
      if (!f.participants || f.participants < 1) x.participants = 'Enter the expected participants.';
      if (!f.room) x.room = 'Select a room.';
      if (!/^\d{10}$/.test(f.contact)) x.contact = 'Enter a 10-digit contact number.';
    }
    setErr(x);
    if (Object.keys(x).length) return;
    const { kind, ...rest } = f;
    createRequest({ type: 'booking', kind, draft, data: { ...rest, participants: Number(f.participants), activityType: kind === 'club' ? 'Club-Based' : 'Association-Based' } });
    nav(`/${user.role}/bk-list`);
  };

  return (
    <form noValidate className="card mx-auto max-w-4xl space-y-4 p-6">
      <div><h2 className="text-xl font-bold text-navy-900">Room booking request</h2><p className="text-sm text-slate-500">{f.kind === 'club' ? 'Club flow: Faculty Advisor → Dean SU → Dean Admin → Principal' : 'Association flow: Faculty Advisor → HOD → Dean SU → Dean Admin → Principal'}</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Activity type" required value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value, groupName: '' })} placeholder="" options={[{ value: 'association', label: 'Association-Based Activity' }, { value: 'club', label: 'Club-Based Activity' }]} />
        {f.kind === 'club'
          ? <Select label="Select club" required value={f.groupName} onChange={set('groupName')} error={err.groupName} options={db.clubs.filter((c) => c.active).map((c) => c.name)} />
          : <><Input label="Association name" required list="assoc" value={f.groupName} onChange={set('groupName')} error={err.groupName} /><datalist id="assoc">{db.associations.map((a) => <option key={a.id} value={a.name} />)}</datalist></>}
      </div>
      <Input label="Event name" required value={f.eventName} onChange={set('eventName')} error={err.eventName} />
      <Textarea label="Event description" rows={3} value={f.description} onChange={set('description')} error={err.description} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Event date" type="date" required value={f.date} onChange={set('date')} error={err.date} />
        <Input label="Start time" type="time" required value={f.start} onChange={set('start')} error={err.start} />
        <Input label="End time" type="time" required value={f.end} onChange={set('end')} error={err.end} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Expected participants" type="number" required value={f.participants} onChange={set('participants')} error={err.participants} />
        <Select label="Required room / classroom" required value={f.room} onChange={set('room')} error={err.room} options={db.rooms.filter((r) => r.active).map((r) => ({ value: r.name, label: `${r.name} (cap. ${r.capacity})` }))} />
        <Input label="Preferred venue" value={f.venue} onChange={set('venue')} />
      </div>
      {room && Number(f.participants) > room.capacity && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{room.name} seats {room.capacity}. Your expected participants exceed its capacity.</p>}
      <CheckGroup label="Equipment requirements" options={room ? [...new Set([...EQUIP, ...room.equipment])] : EQUIP} value={f.equipment} onChange={(v) => setF({ ...f, equipment: v })} />
      <Textarea label="Additional requirements" rows={2} value={f.additional} onChange={set('additional')} />
      <Input label="Contact number" required value={f.contact} onChange={set('contact')} error={err.contact} />
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => nav(-1)}>Cancel</button>
        <button type="button" className="btn-ghost" onClick={send(true)}>Save as draft</button>
        <button className="btn-primary" onClick={send(false)}>Submit request</button>
      </div>
    </form>
  );
}
