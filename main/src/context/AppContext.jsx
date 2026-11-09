import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { seedUsers, seedClubs, seedAssociations, seedEvents, seedDepartments, seedRooms, seedRequests, seedNotifications, seedSettings } from '../data/seed';
import { decide, makeApprovals, flowOf, ROLE_LABELS, currentRole } from '../utils/workflow';
import { uid } from '../utils/helpers';

export const AppContext = createContext(null);
const KEY = 'cpems_db_v1';
const SESSION = 'cpems_session';

const freshDb = () => ({
  users: seedUsers, clubs: seedClubs, associations: seedAssociations, events: seedEvents,
  departments: seedDepartments, rooms: seedRooms, requests: seedRequests, notifications: seedNotifications, settings: seedSettings,
});
const loadDb = () => { try { return JSON.parse(localStorage.getItem(KEY)) || freshDb(); } catch { return freshDb(); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function AppProvider({ children }) {
  const [db, setDb] = useState(loadDb);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION));
  const [toasts, setToasts] = useState([]);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)); }, [db]);
  const user = useMemo(() => db.users.find((u) => u.id === sessionId && u.active) || null, [db.users, sessionId]);

  const toast = useCallback((message, type = 'success') => {
    const id = uid('T');
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const notifyFn = (list, target, text) => [{ id: uid('N'), ...target, text, at: new Date().toISOString(), read: false }, ...list];

  // ---------- auth ----------
  const login = async ({ identifier, password, admin, remember }) => {
    await wait(700);
    const id = identifier.trim().toLowerCase();
    const u = db.users.find((x) => (admin ? x.role === 'admin' && x.username.toLowerCase() === id : x.role !== 'admin' && x.email.toLowerCase() === id));
    if (!u || u.password !== password) return { ok: false, error: admin ? 'Invalid admin username or password.' : 'Invalid email or password. Admins must use the Admin tab.' };
    if (!u.active) return { ok: false, error: 'This account is deactivated. Contact the administrator.' };
    (remember ? localStorage : sessionStorage).setItem(SESSION, u.id);
    setSessionId(u.id);
    return { ok: true, user: u };
  };
  const logout = () => { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); setSessionId(null); };
  const createAdmin = async ({ name, username, password }) => {
    await wait(500);
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return { ok: false, error: 'Username already exists.' };
    const nu = { id: uid('U'), name, username, email: `${username}@college.edu`, password, role: 'admin', department: 'Administration', designation: 'Administrator', regNo: '', active: true };
    setDb((d) => ({ ...d, users: [...d.users, nu] }));
    return { ok: true };
  };

  // ---------- requests ----------
  const createRequest = ({ type, kind, data, draft = false }) => {
    const n = db.requests.filter((r) => r.type === type).length + (type === 'od' ? 1001 : 2001);
    const req = { id: `${type === 'od' ? 'OD' : 'BK'}-${n}`, type, kind: type === 'od' ? undefined : kind, applicantId: user.id, createdAt: new Date().toISOString(), status: draft ? 'Draft' : 'Pending', data };
    req.approvals = makeApprovals(flowOf(req));
    setDb((d) => ({
      ...d, requests: [req, ...d.requests],
      notifications: draft ? d.notifications : notifyFn(d.notifications, { role: req.approvals[0].role }, `New ${type === 'od' ? 'OD application' : 'room booking request'} ${req.id} received from ${user.name}.`),
    }));
    toast(draft ? 'Draft saved.' : `${req.id} submitted successfully.`);
    return req;
  };
  const submitDraft = (id) => { toast(`${id} submitted successfully.`); setDb((d) => {
    const r = d.requests.find((x) => x.id === id);
    return { ...d, requests: d.requests.map((x) => (x.id === id ? { ...x, status: 'Pending' } : x)), notifications: notifyFn(d.notifications, { role: r.approvals[0].role }, `New room booking request ${id} received.`) };
  }); };
  const decideRequest = (id, decision, remarks) => {
    setDb((d) => {
      const r = d.requests.find((x) => x.id === id);
      const out = decide(r, decision, user, remarks);
      const label = ROLE_LABELS[user.role];
      let notes = d.notifications;
      if (out.status === 'Rejected') notes = notifyFn(notes, { userId: r.applicantId }, `${id} was rejected by ${label}: ${remarks}`);
      else if (out.status === 'Approved') notes = notifyFn(notes, { userId: r.applicantId }, r.type === 'od' ? `${id} is fully approved. Your OD is granted.` : `${id} fully approved by ${label}. Room booking confirmed.`);
      else {
        const next = currentRole(out);
        notes = notifyFn(notes, { role: next }, `${id} approved by ${label} and forwarded to you.`);
        notes = notifyFn(notes, { userId: r.applicantId }, `${id} approved by ${label} and forwarded to ${ROLE_LABELS[next]}.`);
      }
      return { ...d, requests: d.requests.map((x) => (x.id === id ? out : x)), notifications: notes };
    });
    toast(decision === 'approve' ? `${id} approved.` : `${id} rejected.`, decision === 'approve' ? 'success' : 'error');
  };

  // ---------- generic CRUD (admin master data) ----------
  const add = (col, item) => setDb((d) => ({ ...d, [col]: [...d[col], { id: uid(col.slice(0, 2).toUpperCase()), ...item }] }));
  const update = (col, id, patch) => setDb((d) => ({ ...d, [col]: d[col].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const remove = (col, id) => setDb((d) => ({ ...d, [col]: d[col].filter((x) => x.id !== id) }));

  // Users: validated create/update; changing an ID cascades through requests, approvals and notifications
  const checkUser = (u, oldId) => {
    const others = db.users.filter((x) => x.id !== oldId);
    if (!u.id.trim()) return 'User ID is required.';
    if (others.some((x) => x.id === u.id)) return `User ID "${u.id}" already exists.`;
    if (others.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) return 'Email already in use.';
    if (u.username && others.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) return 'Username already in use.';
    if (u.regNo && others.some((x) => x.regNo === u.regNo)) return 'Register number already in use.';
    return null;
  };
  const saveUser = (u, oldId) => {
    const error = checkUser(u, oldId);
    if (error) return { ok: false, error };
    setDb((d) => {
      if (!oldId) return { ...d, users: [...d.users, u] };
      const re = (x) => (x === oldId ? u.id : x);
      return {
        ...d,
        users: d.users.map((x) => (x.id === oldId ? u : x)),
        requests: d.requests.map((r) => ({ ...r, applicantId: re(r.applicantId), approvals: r.approvals.map((a) => ({ ...a, by: re(a.by), byName: a.by === oldId ? u.name : a.byName })) })),
        notifications: d.notifications.map((n) => ({ ...n, userId: re(n.userId) })),
      };
    });
    if (oldId && oldId === sessionId && u.id !== oldId) {
      (localStorage.getItem(SESSION) ? localStorage : sessionStorage).setItem(SESSION, u.id);
      setSessionId(u.id);
    }
    return { ok: true };
  };

  // ---------- notifications ----------
  const myNotes = useMemo(() => (user ? db.notifications.filter((n) => n.userId === user.id || n.role === user.role) : []), [db.notifications, user]);
  const markAllRead = () => setDb((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === user.id || n.role === user.role ? { ...n, read: true } : n)) }));
  const setSettings = (patch) => setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const resetDemo = () => { localStorage.removeItem(KEY); setDb(freshDb()); toast('Demo data reset.'); };

  const value = { db, user, login, logout, createAdmin, createRequest, submitDraft, decideRequest, add, update, remove, saveUser, myNotes, markAllRead, setSettings, resetDemo, toast, toasts };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
