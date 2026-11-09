const wrap = (label, error, children, required) => (
  <div>
    {label && <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>}
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
export const Input = ({ label, error, required, ...p }) => wrap(label, error, <input className={`input ${error ? 'border-red-400' : ''}`} {...p} />, required);
export const Textarea = ({ label, error, required, rows = 4, ...p }) => wrap(label, error, <textarea rows={rows} className={`input ${error ? 'border-red-400' : ''}`} {...p} />, required);
export const Select = ({ label, error, required, options, placeholder = 'Select…', ...p }) =>
  wrap(label, error, (
    <select className={`input ${error ? 'border-red-400' : ''}`} {...p}>
      <option value="">{placeholder}</option>
      {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  ), required);
export const CheckGroup = ({ label, options, value = [], onChange }) =>
  wrap(label, null, (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <label key={o} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${on ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300'}`}>
            <input type="checkbox" className="accent-indigo-600" checked={on} onChange={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])} />{o}
          </label>
        );
      })}
    </div>
  ));
