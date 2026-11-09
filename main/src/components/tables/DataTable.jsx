import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import EmptyState from '../common/EmptyState';

// columns: [{ key, label, render?(row) }]. Search runs across all row values (or searchText(row)).
export default function DataTable({ columns, rows, pageSize = 6, filters, searchText, emptyTitle, emptyHint }) {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [page, setPage] = useState(1);
  useEffect(() => setQ(params.get('q') || ''), [params]);
  useEffect(() => setPage(1), [q, rows.length]);

  const text = (r) => (searchText ? searchText(r) : JSON.stringify(r)).toLowerCase();
  const filtered = q ? rows.filter((r) => text(r).includes(q.toLowerCase())) : rows;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input className="input pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {filters}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>{columns.map((c) => <th key={c.key} className="whitespace-nowrap px-4 py-3">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r, i) => (
              <tr key={r.id ?? i} className="hover:bg-slate-50/70">
                {columns.map((c) => <td key={c.key} className="px-4 py-3 align-top">{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <EmptyState title={emptyTitle || 'No records found'} hint={emptyHint || 'Try changing the search or filters.'} />}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
        <span>{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button className="btn-ghost !px-2 !py-1" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
          <span>Page {page} of {pages}</span>
          <button className="btn-ghost !px-2 !py-1" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
