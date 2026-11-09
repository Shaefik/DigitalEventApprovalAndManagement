// ---- Workflow engine: all approval logic lives here, separate from the UI ----
export const ROLE_LABELS = {
  student: 'Student', secretary: 'Secretary', tutor: 'Tutor', 'faculty-advisor': 'Faculty Advisor',
  hod: 'HOD', 'dean-su': 'Dean SU', 'dean-admin': 'Dean Admin', principal: 'Principal', admin: 'Admin',
};

// OD:          Student -> Faculty Advisor -> Tutor -> Student   (HOD is NOT part of OD)
// Association: FA -> HOD -> Dean SU -> Dean Admin -> Principal
// Club:        FA -> Dean SU -> Dean Admin -> Principal          (HOD skipped)
export const FLOWS = {
  od: ['faculty-advisor', 'tutor'],
  association: ['faculty-advisor', 'hod', 'dean-su', 'dean-admin', 'principal'],
  club: ['faculty-advisor', 'dean-su', 'dean-admin', 'principal'],
};

export const flowOf = (r) => (r.type === 'od' ? FLOWS.od : FLOWS[r.kind]);

export const makeApprovals = (flow) =>
  flow.map((role, i) => ({ role, status: i === 0 ? 'Pending' : 'Waiting', by: null, byName: null, at: null, remarks: '' }));

export const currentIndex = (r) => (r.status === 'Pending' ? r.approvals.findIndex((a) => a.status === 'Pending') : -1);
export const currentRole = (r) => r.approvals[currentIndex(r)]?.role ?? null;
export const canAct = (r, user) => r.status === 'Pending' && currentRole(r) === user.role;

export function stageLabel(r) {
  if (r.status === 'Draft') return 'Draft';
  if (r.status === 'Approved') return 'Completed';
  if (r.status === 'Rejected') return `Rejected by ${ROLE_LABELS[r.approvals.find((a) => a.status === 'Rejected')?.role]}`;
  return ROLE_LABELS[currentRole(r)];
}

export function decide(r, decision, user, remarks = '') {
  const i = currentIndex(r);
  if (i < 0) return r;
  const approvals = r.approvals.map((a) => ({ ...a }));
  approvals[i] = { ...approvals[i], status: decision === 'approve' ? 'Approved' : 'Rejected', by: user.id, byName: user.name, at: new Date().toISOString(), remarks };
  if (decision === 'reject') return { ...r, approvals, status: 'Rejected' }; // stop; history stays visible
  if (i + 1 < approvals.length) { approvals[i + 1].status = 'Pending'; return { ...r, approvals }; }
  return { ...r, approvals, status: 'Approved' };
}
