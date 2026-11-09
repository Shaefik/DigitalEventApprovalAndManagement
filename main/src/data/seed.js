import { makeApprovals, decide, FLOWS } from '../utils/workflow';

const mk = (id, name, role, extra = {}) => ({
  id, name, role, email: `${role}@college.edu`, username: role, regNo: '', department: 'CSE',
  designation: '', password: 'password123', active: true, ...extra,
});

export const seedUsers = [
  mk('U001', 'Aarav Kumar', 'student', { regNo: '21CS101', designation: 'B.E. CSE – III Year' }),
  mk('U002', 'Meera Nair', 'secretary', { regNo: '21CS115', designation: 'Student Secretary' }),
  mk('U003', 'Dr. Ravi Shankar', 'tutor', { designation: 'Tutor, Asst. Professor' }),
  mk('U004', 'Prof. Lakshmi Devi', 'faculty-advisor', { designation: 'Faculty Advisor' }),
  mk('U005', 'Dr. S. Murugan', 'hod', { designation: 'Head of Department' }),
  mk('U006', 'Dr. Anitha Rao', 'dean-su', { designation: 'Dean – Student Union' }),
  mk('U007', 'Dr. K. Venkatesh', 'dean-admin', { designation: 'Dean – Administration' }),
  mk('U008', 'Dr. R. Subramanian', 'principal', { designation: 'Principal' }),
  mk('U009', 'System Admin', 'admin', { username: 'admin', password: 'admin123', designation: 'Administrator', department: 'Administration' }),
];

const id = (p, n) => `${p}-${n}`;
export const seedClubs = ['Coding Club', 'Robotics Club', 'Cultural Club', 'Photography Club'].map((name, i) => ({ id: id('CL', i + 1), name, active: true }));
export const seedAssociations = ['CSE Association', 'ECE Association', 'Mechanical Association'].map((name, i) => ({ id: id('AS', i + 1), name }));
export const seedEvents = ['Symposium', 'Hackathon', 'Workshop', 'Paper Presentation', 'Sports Meet', 'Cultural Fest', 'NSS Camp'].map((name, i) => ({ id: id('EV', i + 1), name, active: true }));
export const seedDepartments = [['CSE', 'Computer Science & Engg.'], ['ECE', 'Electronics & Communication'], ['EEE', 'Electrical & Electronics'], ['MECH', 'Mechanical Engineering'], ['IT', 'Information Technology'], ['Administration', 'Administration']].map(([code, name], i) => ({ id: id('DP', i + 1), code, name }));
export const seedRooms = [
  { name: 'Seminar Hall', capacity: 200, equipment: ['Projector', 'Microphone', 'Speakers'] },
  { name: 'Classroom A101', capacity: 60, equipment: ['Projector'] },
  { name: 'Main Auditorium', capacity: 500, equipment: ['Projector', 'Microphone', 'Speakers', 'Stage Lights'] },
  { name: 'Computer Lab 2', capacity: 40, equipment: ['Projector', 'Whiteboard'] },
].map((r, i) => ({ id: id('RM', i + 1), active: true, ...r }));

const by = (role) => seedUsers.find((u) => u.role === role);
const run = (r, steps) => steps.reduce((acc, [d, role, rem]) => decide(acc, d, by(role), rem), r);
const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();
const od = (n, data, steps, h) => run({ id: `OD-${n}`, type: 'od', applicantId: 'U001', createdAt: ago(h), status: 'Pending', approvals: makeApprovals(FLOWS.od), data }, steps);
const bk = (n, kind, data, steps, h) => run({ id: `BK-${n}`, type: 'booking', kind, applicantId: 'U002', createdAt: ago(h), status: 'Pending', approvals: makeApprovals(FLOWS[kind]), data: { activityType: kind === 'club' ? 'Club-Based' : 'Association-Based', ...data } }, steps);

export const seedRequests = [
  od(1001, { eventName: 'Hackathon', reason: 'Representing the college at the state-level hackathon.', date: '2026-11-20', subjects: 'DBMS, Operating Systems', attendance: 82, remarks: '' }, [], 5),
  od(1002, { eventName: 'Paper Presentation', reason: 'Presenting a research paper at the NIT conference.', date: '2026-11-14', subjects: 'Computer Networks', attendance: 78, remarks: 'Certificate will be submitted.' }, [['approve', 'faculty-advisor', 'Approved. Good luck.']], 30),
  od(1003, { eventName: 'Sports Meet', reason: 'Inter-college cricket tournament.', date: '2026-10-02', subjects: 'Maths, DBMS', attendance: 70, remarks: '' }, [['approve', 'faculty-advisor', 'Fine.'], ['reject', 'tutor', 'Attendance is below the required level.']], 200),
  od(1004, { eventName: 'Workshop', reason: 'Cloud computing workshop.', date: '2026-09-18', subjects: 'Cloud Computing', attendance: 88, remarks: '' }, [['approve', 'faculty-advisor', 'OK'], ['approve', 'tutor', 'Approved']], 400),
  bk(2001, 'association', { groupName: 'CSE Association', eventName: 'TechNova Symposium', description: 'Annual technical symposium.', date: '2026-12-05', start: '09:00', end: '16:00', participants: 180, room: 'Seminar Hall', venue: 'Main Block', equipment: ['Projector', 'Microphone'], additional: '', contact: '9876543210' }, [], 8),
  bk(2002, 'club', { groupName: 'Coding Club', eventName: 'CodeSprint', description: '6-hour coding contest.', date: '2026-11-28', start: '10:00', end: '16:00', participants: 40, room: 'Computer Lab 2', venue: 'IT Block', equipment: ['Projector'], additional: '', contact: '9876543210' }, [['approve', 'faculty-advisor', 'Recommended.']], 20),
  bk(2003, 'association', { groupName: 'ECE Association', eventName: 'Circuit Design Contest', description: 'Inter-year contest.', date: '2026-10-25', start: '09:30', end: '13:00', participants: 55, room: 'Classroom A101', venue: 'ECE Block', equipment: ['Projector'], additional: '', contact: '9876543210' }, [['approve', 'faculty-advisor', 'OK'], ['approve', 'hod', 'Approved'], ['approve', 'dean-su', 'Approved'], ['approve', 'dean-admin', 'Approved'], ['approve', 'principal', 'Granted.']], 500),
];

export const seedNotifications = [
  { id: 'N1', role: 'faculty-advisor', text: 'New OD application OD-1001 received.', at: ago(5), read: false },
  { id: 'N2', role: 'faculty-advisor', text: 'New room booking request BK-2001 received.', at: ago(8), read: false },
  { id: 'N3', role: 'tutor', text: 'OD-1002 forwarded to you by Faculty Advisor.', at: ago(29), read: false },
];

export const seedSettings = { collegeName: 'Excel Institute of Technology', academicYear: '2026-27', odMinAttendance: 75, emailAlerts: true };
