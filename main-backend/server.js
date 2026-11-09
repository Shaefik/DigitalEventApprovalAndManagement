require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// =========================================================
// 1. WORKFLOW CONSTANTS (Matches your friend's workflow.js!)
// =========================================================
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

// =========================================================
// 2. MONGODB SCHEMAS & MODELS (Matches seed.js 100%!)
// =========================================================

const User = mongoose.model('User', new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  role: String,
  email: String,
  username: String,
  regNo: { type: String, default: '' },
  department: { type: String, default: 'CSE' },
  designation: { type: String, default: '' },
  password: { type: String, default: 'password123' },
  active: { type: Boolean, default: true }
}));

const Club = mongoose.model('Club', new mongoose.Schema({
  id: String, name: String, active: { type: Boolean, default: true }
}));

const Association = mongoose.model('Association', new mongoose.Schema({
  id: String, name: String, active: { type: Boolean, default: true }
}));

const EventActivity = mongoose.model('EventActivity', new mongoose.Schema({
  id: String, name: String, active: { type: Boolean, default: true }
}));

const Department = mongoose.model('Department', new mongoose.Schema({
  id: String, code: String, name: String
}));

const Room = mongoose.model('Room', new mongoose.Schema({
  id: String, name: String, capacity: Number, equipment: [String], active: { type: Boolean, default: true }
}));

const Request = mongoose.model('Request', new mongoose.Schema({
  id: { type: String, unique: true }, // e.g., "OD-1001" or "BK-2001"
  type: String,                       // 'od' or 'booking'
  kind: String,                       // 'club' or 'association' (for bookings)
  applicantId: String,
  createdAt: String,
  status: { type: String, default: 'Pending' }, // 'Pending', 'Approved', 'Rejected'
  approvals: [{
    role: String,
    status: String,                   // 'Pending', 'Waiting', 'Approved', 'Rejected'
    by: String,
    byName: String,
    at: String,
    remarks: String
  }],
  data: mongoose.Schema.Types.Mixed   // Holds all form fields from ODForm or BookingForm
}));

const Notification = mongoose.model('Notification', new mongoose.Schema({
  id: String,
  role: String,
  text: String,
  at: String,
  read: { type: Boolean, default: false }
}));

// =========================================================
// 3. AUTH MIDDLEWARE (Checks Bearer token from api.js)
// =========================================================
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch (e) {
      // Allow fallback if token expired during local dev
    }
  }
  next();
};

app.use('/api', authMiddleware);

// =========================================================
// 4. AUTH ROUTES (Matches authAPI in api.js)
// =========================================================

// Student / Staff Login (by email or username)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const query = email ? { email: email.trim().toLowerCase() } : { username };
    const user = await User.findOne(query);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.active) {
      return res.status(403).json({ message: 'Your account is deactivated' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET);
    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Login (by username + password)
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await User.findOne({ username, role: 'admin' });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    const token = jwt.sign({ id: admin.id, role: admin.role, name: admin.name }, process.env.JWT_SECRET);
    res.json({ token, user: admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Sign Up
app.post('/api/auth/admin', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already taken' });

    const count = await User.countDocuments();
    const newAdmin = await User.create({
      id: `U00${count + 1}`,
      name,
      username,
      email: `${username}@college.edu`,
      password,
      role: 'admin',
      designation: 'Administrator',
      department: 'Administration',
      active: true
    });
    const token = jwt.sign({ id: newAdmin.id, role: newAdmin.role, name: newAdmin.name }, process.env.JWT_SECRET);
    res.status(201).json({ token, user: newAdmin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================================================
// 5. REQUEST ROUTES (Matches requestAPI in api.js)
// =========================================================

// GET /api/requests -> List all OD and Hall Booking requests
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests -> Create new OD or Room Booking request
app.post('/api/requests', async (req, res) => {
  try {
    const payload = req.body;
    const isOd = payload.type === 'od';
    const prefix = isOd ? 'OD' : 'BK';
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const flow = isOd ? FLOWS.od : FLOWS[payload.kind];

    const newReq = await Request.create({
      id: payload.id || `${prefix}-${randomNum}`,
      type: payload.type,
      kind: payload.kind,
      applicantId: payload.applicantId || (req.user && req.user.id) || 'U001',
      createdAt: new Date().toISOString(),
      status: 'Pending',
      approvals: payload.approvals || makeApprovals(flow),
      data: payload.data
    });

    // Create notification for Faculty Advisor (first step)
    await Notification.create({
      id: `N-${Date.now()}`,
      role: 'faculty-advisor',
      text: `New ${isOd ? 'OD application' : 'room booking'} ${newReq.id} received.`,
      at: new Date().toISOString(),
      read: false
    });

    res.status(201).json(newReq);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/requests/:id/decision -> Approve or Reject (Matches workflow.js decide()!)
app.post('/api/requests/:id/decision', async (req, res) => {
  try {
    const { decision, remarks = '', user: bodyUser } = req.body;
    const actor = bodyUser || req.user || { id: 'U004', name: 'Authority' };

    const r = await Request.findOne({ id: req.params.id });
    if (!r) return res.status(404).json({ message: 'Request not found' });

    const i = r.status === 'Pending' ? r.approvals.findIndex(a => a.status === 'Pending') : -1;
    if (i < 0) return res.json(r);

    // Update current authority's step
    r.approvals[i].status = decision === 'approve' ? 'Approved' : 'Rejected';
    r.approvals[i].by = actor.id;
    r.approvals[i].byName = actor.name;
    r.approvals[i].at = new Date().toISOString();
    r.approvals[i].remarks = remarks;

    if (decision === 'reject') {
      r.status = 'Rejected';
    } else if (i + 1 < r.approvals.length) {
      // Move 'Pending' to the next person in hierarchy!
      r.approvals[i + 1].status = 'Pending';

      await Notification.create({
        id: `N-${Date.now()}`,
        role: r.approvals[i + 1].role,
        text: `${r.id} forwarded to you by ${actor.name}.`,
        at: new Date().toISOString(),
        read: false
      });
    } else {
      // Everyone approved!
      r.status = 'Approved';
    }

    await r.save();
    res.json(r);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// =========================================================
// 6. MASTER CRUD ROUTES (Matches masterAPI(resource) in api.js)
//    Handles: /users, /clubs, /associations, /events, /departments, /rooms
// =========================================================
const resourceModels = {
  users: { model: User, prefix: 'U0' },
  clubs: { model: Club, prefix: 'CL' },
  associations: { model: Association, prefix: 'AS' },
  events: { model: EventActivity, prefix: 'EV' },
  departments: { model: Department, prefix: 'DP' },
  rooms: { model: Room, prefix: 'RM' },
};

Object.entries(resourceModels).forEach(([resource, { model, prefix }]) => {
  // LIST
  app.get(`/api/${resource}`, async (req, res) => {
    const items = await model.find();
    res.json(items);
  });

  // CREATE
  app.post(`/api/${resource}`, async (req, res) => {
    const count = await model.countDocuments();
    const newItem = await model.create({
      id: req.body.id || `${prefix}-${count + 1 + Math.floor(Math.random() * 100)}`,
      ...req.body
    });
    res.status(201).json(newItem);
  });

  // UPDATE
  app.put(`/api/${resource}/:id`, async (req, res) => {
    const updated = await model.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  });

  // DELETE
  app.delete(`/api/${resource}/:id`, async (req, res) => {
    await model.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Deleted', id: req.params.id });
  });
});

// =========================================================
// 7. NOTIFICATION ROUTES (Matches notificationAPI in api.js)
// =========================================================
app.get('/api/notifications', async (req, res) => {
  const list = await Notification.find().sort({ at: -1 });
  res.json(list);
});

app.post('/api/notifications/read', async (req, res) => {
  await Notification.updateMany({}, { read: true });
  const list = await Notification.find().sort({ at: -1 });
  res.json(list);
});

// =========================================================
// 8. AUTO-SEED INITIAL DATA (Matches your friend's seed.js!)
// =========================================================
async function seedDatabaseIfEmpty() {
  const userCount = await User.countDocuments();
  if (userCount > 0) return; // Already seeded!

  console.log('🌱 Database is empty! Auto-seeding with initial data...');

  const mk = (id, name, role, extra = {}) => ({
    id, name, role, email: `${role}@college.edu`, username: role, regNo: '', department: 'CSE',
    designation: '', password: 'password123', active: true, ...extra,
  });

  const seedUsers = [
    mk('U001', 'Safeer Ahamed B', 'student', { regNo: '26MX341', designation: 'MCA – I Year', department: 'MCA' }),
    mk('U002', 'Shafeeq', 'secretary', { regNo: '26MX342', designation: 'Student Secretary', department: 'MCA' }),
    mk('U003', 'Dr. Ravi Shankar', 'tutor', { designation: 'Tutor, Asst. Professor' }),
    mk('U004', 'Mr. Sundar C', 'faculty-advisor', { designation: 'Faculty Advisor' }),
    mk('U005', 'Dr. S. Murugan', 'hod', { designation: 'Head of Department' }),
    mk('U006', 'Dr. Anitha Rao', 'dean-su', { designation: 'Dean – Student Union' }),
    mk('U007', 'Dr. K. Venkatesh', 'dean-admin', { designation: 'Dean – Administration' }),
    mk('U008', 'Dr. R. Subramanian', 'principal', { designation: 'Principal' }),
    mk('U009', 'System Admin', 'admin', { username: 'admin', password: 'admin123', designation: 'Administrator', department: 'Administration' }),
  ];

  await User.insertMany(seedUsers);
  await Club.insertMany(['Coding Club', 'Robotics Club', 'Cultural Club', 'Photography Club'].map((name, i) => ({ id: `CL-${i + 1}`, name, active: true })));
  await Association.insertMany(['CSE Association', 'ECE Association', 'Mechanical Association', 'MCA Association'].map((name, i) => ({ id: `AS-${i + 1}`, name })));
  await EventActivity.insertMany(['Symposium', 'Hackathon', 'Workshop', 'Paper Presentation', 'Sports Meet', 'Cultural Fest', 'NSS Camp'].map((name, i) => ({ id: `EV-${i + 1}`, name, active: true })));
  await Department.insertMany([['MCA', 'Computer Applications'], ['CSE', 'Computer Science & Engg.'], ['ECE', 'Electronics & Communication'], ['EEE', 'Electrical & Electronics'], ['MECH', 'Mechanical Engineering'], ['IT', 'Information Technology'], ['Administration', 'Administration']].map(([code, name], i) => ({ id: `DP-${i + 1}`, code, name })));
  await Room.insertMany([
    { id: 'RM-1', name: 'Seminar Hall', capacity: 200, equipment: ['Projector', 'Microphone', 'Speakers'], active: true },
    { id: 'RM-2', name: 'Classroom A101', capacity: 60, equipment: ['Projector'], active: true },
    { id: 'RM-3', name: 'Main Auditorium', capacity: 500, equipment: ['Projector', 'Microphone', 'Speakers', 'Stage Lights'], active: true },
    { id: 'RM-4', name: 'Computer Lab 2', capacity: 40, equipment: ['Projector', 'Whiteboard'], active: true },
  ]);

  // Helper to simulate initial requests just like seed.js
  const by = (role) => seedUsers.find((u) => u.role === role);
  const decideLocal = (r, decision, user, remarks = '') => {
    const i = r.status === 'Pending' ? r.approvals.findIndex((a) => a.status === 'Pending') : -1;
    if (i < 0) return r;
    const approvals = r.approvals.map((a) => ({ ...a }));
    approvals[i] = { ...approvals[i], status: decision === 'approve' ? 'Approved' : 'Rejected', by: user.id, byName: user.name, at: new Date().toISOString(), remarks };
    if (decision === 'reject') return { ...r, approvals, status: 'Rejected' };
    if (i + 1 < approvals.length) { approvals[i + 1].status = 'Pending'; return { ...r, approvals }; }
    return { ...r, approvals, status: 'Approved' };
  };
  const run = (r, steps) => steps.reduce((acc, [d, role, rem]) => decideLocal(acc, d, by(role), rem), r);
  const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();
  const od = (n, data, steps, h) => run({ id: `OD-${n}`, type: 'od', applicantId: 'U001', createdAt: ago(h), status: 'Pending', approvals: makeApprovals(FLOWS.od), data }, steps);
  const bk = (n, kind, data, steps, h) => run({ id: `BK-${n}`, type: 'booking', kind, applicantId: 'U002', createdAt: ago(h), status: 'Pending', approvals: makeApprovals(FLOWS[kind]), data: { activityType: kind === 'club' ? 'Club-Based' : 'Association-Based', ...data } }, steps);

  await Request.insertMany([
    od(1001, { eventName: 'Hackathon', reason: 'Representing the college at the state-level hackathon.', date: '2026-11-20', subjects: 'DBMS, Operating Systems', attendance: 82, remarks: '' }, [], 5),
    od(1002, { eventName: 'Paper Presentation', reason: 'Presenting a research paper at the NIT conference.', date: '2026-11-14', subjects: 'Computer Networks', attendance: 78, remarks: 'Certificate will be submitted.' }, [['approve', 'faculty-advisor', 'Approved. Good luck.']], 30),
    od(1003, { eventName: 'Sports Meet', reason: 'Inter-college cricket tournament.', date: '2026-10-02', subjects: 'Maths, DBMS', attendance: 70, remarks: '' }, [['approve', 'faculty-advisor', 'Fine.'], ['reject', 'tutor', 'Attendance is below the required level.']], 200),
    bk(2001, 'association', { groupName: 'CSE Association', eventName: 'TechNova Symposium', description: 'Annual technical symposium.', date: '2026-12-05', start: '09:00', end: '16:00', participants: 180, room: 'Seminar Hall', venue: 'Main Block', equipment: ['Projector', 'Microphone'], additional: '', contact: '9876543210' }, [], 8),
    bk(2002, 'club', { groupName: 'Coding Club', eventName: 'CodeSprint', description: '6-hour coding contest.', date: '2026-11-28', start: '10:00', end: '16:00', participants: 40, room: 'Computer Lab 2', venue: 'IT Block', equipment: ['Projector'], additional: '', contact: '9876543210' }, [['approve', 'faculty-advisor', 'Recommended.']], 20),
  ]);

  await Notification.insertMany([
    { id: 'N1', role: 'faculty-advisor', text: 'New OD application OD-1001 received.', at: ago(5), read: false },
    { id: 'N2', role: 'faculty-advisor', text: 'New room booking request BK-2001 received.', at: ago(8), read: false },
  ]);

  console.log('✅ Auto-seeding complete! All users, clubs, rooms, and requests are now in MongoDB.');
}

// =========================================================
// 9. CONNECT TO MONGODB & START SERVER
// =========================================================
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB!');
    await seedDatabaseIfEmpty();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Backend Server running at http://localhost:${PORT}/api`));
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));