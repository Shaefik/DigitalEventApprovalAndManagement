const studentList = require('./students');
const facultyList = require('./faculty');
const { FLOWS, makeApprovals, decideLocal } = require('../workflow');


const SECTION_RANGES = [['G1', 101, 230], ['G2', 301, 358]];   
const sectionOf = (regNo) => {
  const n = parseInt(String(regNo).slice(-3), 10);
  const hit = SECTION_RANGES.find(([, from, to]) => n >= from && n <= to);
  return hit ? hit[0] : '';
};

const SECRETARY_REGNO = '26MX332';
const mk = (id, name, role, extra = {}) => ({
  id,
  name,
  role,
  email: extra.email || `${role}@college.edu`,
  username: extra.username || role,
  regNo: '',
  department: 'CSE',
  designation: '',
  password: extra.password || 'password123',
  active: true,
  ...extra,
});

function buildSeed() {
  // ---------- Users ----------
   const students = studentList.map(([regNo, name], i) =>
    mk(`U${String(i + 1).padStart(3, '0')}`, name, regNo === SECRETARY_REGNO ? 'secretary' : 'student', {
      regNo,
      section: sectionOf(regNo),
      designation: regNo === SECRETARY_REGNO ? 'Student Secretary, MCA – I Year' : 'MCA – I Year',
      department: 'MCA',
      email: `${regNo}@psgtech.ac.in`,
      username: `${regNo}@psgtech.ac.in`,
      password: 'password@123',
    })
  );
    const faculty = facultyList.map((f) => mk(f.id, f.name, f.role, f));

  const staff = [
  ...faculty,

  mk('A001', 'System Admin', 'admin', {
    username: 'admin',
    email: 'admin@college.edu',
    password: 'admin123',
    designation: 'Administrator',
    department: 'Administration',
  }),

  // mk('S001', 'Student Secretary', 'secretary', {
  //   username: 'Natesh M',
  //   email: '26mx332@psgtech.ac.in',
  //   designation: 'Student Secretary',
  //   department: 'MCA',
  // }),
];
  

  const users = [...students, ...staff];

  // ---------- Master data ----------
  const clubs = ['Coding Club', 'Robotics Club', 'Cultural Club', 'Photography Club'].map(
    (name, i) => ({ id: `CL-${i + 1}`, name, active: true })
  );

  const associations = [
    'CSE Association',
    'ECE Association',
    'Mechanical Association',
    'MCA Association',
  ].map((name, i) => ({ id: `AS-${i + 1}`, name, active: true }));

  const events = [
    'Symposium',
    'Hackathon',
    'Workshop',
    'Paper Presentation',
    'Sports Meet',
    'Cultural Fest',
    'NSS Camp',
  ].map((name, i) => ({ id: `EV-${i + 1}`, name, active: true }));

  const departments = [
    ['MCA', 'Computer Applications'],
    ['CSE', 'Computer Science & Engg.'],
    ['ECE', 'Electronics & Communication'],
    ['EEE', 'Electrical & Electronics'],
    ['MECH', 'Mechanical Engineering'],
    ['IT', 'Information Technology'],
    ['Administration', 'Administration'],
  ].map(([code, name], i) => ({ id: `DP-${i + 1}`, code, name }));

  const rooms = [
    { id: 'RM-1', name: 'Seminar Hall', capacity: 200, equipment: ['Projector', 'Microphone', 'Speakers'], active: true },
    { id: 'RM-2', name: 'Classroom A101', capacity: 60, equipment: ['Projector'], active: true },
    { id: 'RM-3', name: 'Main Auditorium', capacity: 500, equipment: ['Projector', 'Microphone', 'Speakers', 'Stage Lights'], active: true },
    { id: 'RM-4', name: 'Computer Lab 2', capacity: 40, equipment: ['Projector', 'Whiteboard'], active: true },
  ];

  // ---------- Sample requests ----------
  const by = (role) => users.find((u) => u.role === role);
  const run = (r, steps) =>
    steps.reduce((acc, [d, role, rem]) => decideLocal(acc, d, by(role), rem), r);
  const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();

  const od = (n, data, steps, h) =>
    run(
      {
        id: `OD-${n}`,
        type: 'od',
        applicantId: 'U001',
        createdAt: ago(h),
        status: 'Pending',
        approvals: makeApprovals(FLOWS.od),
        data,
      },
      steps
    );

  const bk = (n, kind, data, steps, h) =>
    run(
      {
        id: `BK-${n}`,
        type: 'booking',
        kind,
        applicantId: 'U001',
        createdAt: ago(h),
        status: 'Pending',
        approvals: makeApprovals(FLOWS[kind]),
        data: { activityType: kind === 'club' ? 'Club-Based' : 'Association-Based', ...data },
      },
      steps
    );

  const requests = [
    od(1001, { eventName: 'Hackathon', reason: 'Representing the college at the state-level hackathon.', date: '2026-11-20', subjects: 'DBMS, Operating Systems', attendance: 82, remarks: '' }, [], 5),
    od(1002, { eventName: 'Paper Presentation', reason: 'Presenting a research paper at the NIT conference.', date: '2026-11-14', subjects: 'Computer Networks', attendance: 78, remarks: 'Certificate will be submitted.' }, [['approve', 'faculty-advisor', 'Approved. Good luck.']], 30),
    od(1003, { eventName: 'Sports Meet', reason: 'Inter-college cricket tournament.', date: '2026-10-02', subjects: 'Maths, DBMS', attendance: 70, remarks: '' }, [['approve', 'faculty-advisor', 'Fine.'], ['reject', 'tutor', 'Attendance is below the required level.']], 200),
    bk(2001, 'association', { groupName: 'CSE Association', eventName: 'TechNova Symposium', description: 'Annual technical symposium.', date: '2026-12-05', start: '09:00', end: '16:00', participants: 180, room: 'Seminar Hall', venue: 'Main Block', equipment: ['Projector', 'Microphone'], additional: '', contact: '9876543210' }, [], 8),
    bk(2002, 'club', { groupName: 'Coding Club', eventName: 'CodeSprint', description: '6-hour coding contest.', date: '2026-11-28', start: '10:00', end: '16:00', participants: 40, room: 'Computer Lab 2', venue: 'IT Block', equipment: ['Projector'], additional: '', contact: '9876543210' }, [['approve', 'faculty-advisor', 'Recommended.']], 20),
  ];

  // ---------- Notifications ----------
  const notifications = [
    { id: 'N1', role: 'faculty-advisor', text: 'New OD application OD-1001 received.', at: ago(5), read: false },
    { id: 'N2', role: 'faculty-advisor', text: 'New room booking request BK-2001 received.', at: ago(8), read: false },
  ];

  return { users, clubs, associations, events, departments, rooms, requests, notifications };
}

module.exports = { buildSeed };
