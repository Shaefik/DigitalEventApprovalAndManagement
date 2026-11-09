import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Bell, GraduationCap, LogOut, Menu, Search, X } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { NAV } from '../../utils/roles';
import { ROLE_LABELS } from '../../utils/workflow';
import { fmtDateTime } from '../../utils/helpers';

export default function Layout() {
  const { user, logout, db, myNotes, markAllRead } = useApp();
  const nav = NAV[user.role];
  const loc = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const unread = myNotes.filter((n) => !n.read).length;
  const current = nav.find((n) => loc.pathname.endsWith(`/${n.page}`));

  const search = (e) => {
    e.preventDefault();
    const target = nav.find((n) => ['od-queue', 'bk-queue', 'od-list', 'bk-list', 'users'].includes(n.page));
    if (target) navigate(`/${user.role}/${target.page}?q=${encodeURIComponent(q)}`);
  };

  const Sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-slate-200">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-white"><GraduationCap size={22} /></div>
        <div className="leading-tight"><p className="text-sm font-bold text-white">{db.settings.collegeName}</p><p className="text-xs text-slate-400">Permission &amp; Events</p></div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((n) => {
          const Icon = Icons[n.icon];
          return (
            <NavLink key={n.page} to={`/${user.role}/${n.page}`} onClick={() => setDrawer(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-indigo-500/20 text-white ring-1 ring-indigo-400/40' : 'text-slate-300 hover:bg-white/5'}`}>
              <Icon size={18} />{n.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400 text-sm font-bold text-navy-900">{user.name[0]}</div>
          <div className="min-w-0 leading-tight"><p className="truncate text-sm font-semibold text-white">{user.name}</p><p className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</p></div>
        </div>
        <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-semibold hover:bg-white/20"><LogOut size={16} />Logout</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 md:block">{Sidebar}</aside>
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-navy-900/60" onClick={() => setDrawer(false)} />
          <aside className="relative h-full w-64"><button className="absolute right-2 top-2 z-10 text-white" onClick={() => setDrawer(false)} aria-label="Close menu"><X /></button>{Sidebar}</aside>
        </div>
      )}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <button className="md:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu /></button>
        <h1 className="text-lg font-bold text-navy-900">{current?.label || 'Dashboard'}</h1>
        <form onSubmit={search} className="relative ml-auto hidden w-64 sm:block">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input className="input pl-9" placeholder="Search requests…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="relative">
          <button onClick={() => { setBell(!bell); setMenu(false); }} className="relative rounded-lg p-2 hover:bg-slate-100" aria-label="Notifications">
            <Bell size={20} />{unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </button>
          {bell && (
            <div className="card absolute right-0 mt-2 w-80 max-w-[85vw] shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><b className="text-sm">Notifications</b><button className="text-xs font-semibold text-indigo-600" onClick={markAllRead}>Mark all read</button></div>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {myNotes.length === 0 && <li className="p-4 text-sm text-slate-500">You're all caught up.</li>}
                {myNotes.map((n) => <li key={n.id} className={`px-4 py-3 text-sm ${n.read ? '' : 'bg-indigo-50/60'}`}><p>{n.text}</p><p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(n.at)}</p></li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => { setMenu(!menu); setBell(false); }} className="grid h-9 w-9 place-items-center rounded-full bg-navy-800 text-sm font-bold text-white" aria-label="Profile menu">{user.name[0]}</button>
          {menu && (
            <div className="card absolute right-0 mt-2 w-52 p-1 shadow-lg">
              <div className="px-3 py-2"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p></div>
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { navigate(`/${user.role}/settings`); setMenu(false); }}>Profile &amp; settings</button>
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6"><Outlet /></main>
    </div>
  );
}
