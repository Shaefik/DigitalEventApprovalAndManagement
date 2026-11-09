export default function StatCard({ label, value, icon: Icon, tone = 'indigo' }) {
  const tones = { indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', navy: 'bg-navy-50 text-navy-700' };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{Icon && <Icon size={22} />}</div>
      <div><p className="text-2xl font-extrabold text-navy-900">{value}</p><p className="text-sm text-slate-500">{label}</p></div>
    </div>
  );
}
