
const FLOWS = {
  od: ['faculty-advisor', 'tutor'],
  association: ['faculty-advisor', 'hod', 'dean-su', 'dean-admin', 'principal'],
  club: ['faculty-advisor', 'dean-su', 'dean-admin', 'principal'],
};

const makeApprovals = (flow) =>
  flow.map((role, i) => ({
    role,
    status: i === 0 ? 'Pending' : 'Waiting',
    by: null,
    byName: null,
    at: null,
    remarks: '',
  }));

// Pure helper used only while building seed data
const decideLocal = (r, decision, user, remarks = '') => {
  const i = r.status === 'Pending' ? r.approvals.findIndex((a) => a.status === 'Pending') : -1;
  if (i < 0) return r;
  const approvals = r.approvals.map((a) => ({ ...a }));
  approvals[i] = {
    ...approvals[i],
    status: decision === 'approve' ? 'Approved' : 'Rejected',
    by: user.id,
    byName: user.name,
    at: new Date().toISOString(),
    remarks,
  };
  if (decision === 'reject') return { ...r, approvals, status: 'Rejected' };
  if (i + 1 < approvals.length) {
    approvals[i + 1].status = 'Pending';
    return { ...r, approvals };
  }
  return { ...r, approvals, status: 'Approved' };
};

module.exports = { FLOWS, makeApprovals, decideLocal };
