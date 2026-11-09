export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtDateTime = (d) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—');
export const uid = (p = 'ID') => `${p}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
export const userName = (users, id) => users.find((u) => u.id === id)?.name ?? 'Unknown user';
