import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Textarea } from '../../components/forms/Fields';
import { useApp } from '../../hooks/useApp';
import { uploadAPI } from '../../services/api';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ODForm() {
  const { db, user, createRequest } = useApp();
  const nav = useNavigate();
 const [f, setF] = useState({
  eventName: '',
  reason: '',
  date: '',
  subjects: '',
  attendance: '',
  remarks: '',
  proofLink: ''
});
const [file, setFile] = useState(null);
const [preview, setPreview] = useState(null);
const [busy, setBusy] = useState(false);
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  
  // Small preview of the chosen screenshot
  useEffect(() => {
    if (!file) return setPreview(null);

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (e) => {
    const picked = e.target.files?.[0];

    if (!picked) return setFile(null);

    if (!IMAGE_TYPES.includes(picked.type)) {
      e.target.value = '';
      return setErr((x) => ({
        ...x,
        proof: 'Only JPG, PNG or WEBP images are allowed.'
      }));
    }

    if (picked.size > 5 * 1024 * 1024) {
      e.target.value = '';
      return setErr((x) => ({
        ...x,
        proof: 'The image must be 5 MB or smaller.'
      }));
    }

    setErr((x) => ({ ...x, proof: undefined }));
    setFile(picked);
  };



const submit = async (e) => {
  e.preventDefault();

  const x = {};
  const link = f.proofLink.trim();

  if (!f.eventName) x.eventName = 'Select an event or activity.';
  if (f.reason.trim().length < 10) x.reason = 'Describe the reason in at least 10 characters.';
  if (!f.date) x.date = 'Choose the event date.';
  if (!f.subjects.trim()) x.subjects = 'List the subjects you will miss.';

  if (
    f.attendance === '' ||
    f.attendance < 0 ||
    f.attendance > 100
  ) {
    x.attendance = 'Enter a percentage between 0 and 100.';
  }

  if (!link && !file) {
    x.proof = 'Attach proof: a link to the competition or registration page, or a screenshot.';
  } else if (link && !/^https?:\/\/\S+\.\S+/i.test(link)) {
    x.proof = 'Enter a valid link that starts with http:// or https://';
  }

  setErr(x);

  if (Object.keys(x).length) return;

  setBusy(true);

  try {
    let proofFile = '';
    let proofName = '';

    if (file) {
      const { data } = await uploadAPI.proof(file);
      proofFile = data.url;
      proofName = data.name;
    }

    await createRequest({
      type: 'od',
      data: {
        ...f,
        proofLink: link,
        proofFile,
        proofName,
        attendance: Number(f.attendance)
      }
    });

    nav(`/${user.role}/od-list`);

  } catch (e2) {
    setErr({
      proof: e2.response?.data?.message ||
        'Could not submit. Please try again.'
    });
  }

  setBusy(false);
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

<div className={`rounded-xl border p-4 ${err.proof ? 'border-red-400' : 'border-slate-200'}`}>
  <p className="label">
    Proof of participation <span className="text-red-500">*</span>
  </p>

  <p className="mb-3 text-xs text-slate-500">
    Give a link to the competition page, or upload a screenshot of your registration. One of the two is required.
  </p>

  <Input
    label="Link (competition or registration page)"
    placeholder="https://..."
    value={f.proofLink}
    onChange={set('proofLink')}
  />

  <div className="mt-3">
    <label className="label">
      Screenshot (JPG, PNG or WEBP, up to 5 MB)
    </label>

    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={pickFile}
      className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-slate-200"
    />

    {preview && (
      <img
        src={preview}
        alt="Selected proof"
        className="mt-2 max-h-40 rounded-lg border border-slate-200"
      />
    )}
  </div>

  {err.proof && (
    <p className="mt-2 text-xs text-red-600">
      {err.proof}
    </p>
  )}
</div>

      <Textarea label="Additional remarks" rows={2} value={f.remarks} onChange={set('remarks')} />
<div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => nav(-1)}>Cancel</button><button className="btn-primary" disabled={busy}>
  {busy ? 'Submitting…' : 'Submit application'}
</button></div>    </form>
  );
}
