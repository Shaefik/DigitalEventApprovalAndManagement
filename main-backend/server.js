const dns = require('dns');
dns.setServers(['8.8.8.8','1.1.1.1']);

// faculty import
const facultyList = require('./seed/faculty');

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { FLOWS, makeApprovals } = require('./workflow');
const { buildSeed } = require('./seed/seedData');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('REQ:', req.method, req.originalUrl);
  next();
});

// =========================================================
// 1. MONGODB SCHEMAS & MODELS
// =========================================================

const User = mongoose.model('User', new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  role: String,
  email: String,
  username: String,
  regNo: { type: String, default: '' },
  //included section
  section: { type: String, default: ''},
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
  id: { type: String, unique: true },
  type: String,
  kind: String,
  applicantId: String,
  createdAt: String,
  status: { type: String, default: 'Pending' },
  approvals: [{
    role: String,
    status: String,
    by: String,
    byName: String,
    at: String,
    remarks: String
  }],
  data: mongoose.Schema.Types.Mixed
}));

const Notification = mongoose.model('Notification', new mongoose.Schema({
  id: String,
  role: String,
  text: String,
  at: String,
  read: { type: Boolean, default: false }
}));

// =========================================================
// 2. AUTH MIDDLEWARE
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

// Use this on routes that must have a logged-in user
const requireAuth = (req, res, next) =>
  req.user ? next() : res.status(401).json({ message: 'Please log in again.' });

// Adding it for admin security - safeer 1

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Please log in again.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};


app.use('/api', authMiddleware);

// =========================================================
// 3. AUTH ROUTES
// =========================================================

// Common Login - All users
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (
      typeof identifier !== 'string' ||
      typeof password !== 'string' ||
      !identifier.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email or username and password are required.'
      });
    }

    const loginId = identifier.trim();

    const user = await User.findOne({
      $or: [
        { email: loginId },
        { username: loginId }
      ]
    }).collation({
      locale: 'en',
      strength: 2
    });

    if (!user || user.password !== password) {
      return res.status(401).json({
        message: 'Invalid credentials.'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: 'Your account is deactivated.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET
    );

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({
      token,
      user: safeUser
    });

  } catch (err) {
    console.error('Login error:', err);

    res.status(500).json({
      message: 'Unable to log in.'
    });
  }
});


// admin merging temp - safeer
// // Admin Sign Up
// // changing it for adming security - safeer 2
// // app.post('/api/auth/admin', async (req, res) => {
//   // Admin Sign Up - Existing administrators only
// app.post(
//   '/api/auth/admin',
//   requireAuth,
//   requireRole('admin'),
//   async (req, res) => {
//   try {
//     const { name, username, password } = req.body;
//     const exists = await User.findOne({ username });
//     if (exists) return res.status(400).json({ message: 'Username already taken' });

//     const count = await User.countDocuments();
//     const newAdmin = await User.create({
//       id: `U00${count + 1}`,
//       name,
//       username,
//       email: `${username}@college.edu`,
//       password,
//       role: 'admin',
//       designation: 'Administrator',
//       department: 'Administration',
//       active: true
//     });
//     const token = jwt.sign({ id: newAdmin.id, role: newAdmin.role, name: newAdmin.name }, process.env.JWT_SECRET);
//     const safeAdmin = newAdmin.toObject();
//     delete safeAdmin.password;
//     res.status(201).json({ token, user: safeAdmin });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// Change password (current + new + confirm)
app.put('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

  
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'New password must differ from the current one.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// =========================================================
// 4. REQUEST ROUTES
// =========================================================

// GET /api/requests -> List all OD and Hall Booking requests
app.get('/api/requests', async (req, res) => {
  try {
       
    let filter = {};
    // A tutor only sees requests from students of their own section
    if (req.user && req.user.role === 'tutor') {
      const me = await User.findOne({ id: req.user.id });
      if (me && me.section) {
        const ids = await User.find({
          role: { $in: ['student', 'secretary'] },
          section: { $in: [me.section, '', null] },
        }).distinct('id');
        filter = { applicantId: { $in: ids } };
      }
    }
    
    const requests = await Request.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests -> Create new OD or Room Booking request
app.post('/api/requests',requireAuth, async (req, res) => {
  try {
    const payload = req.body;
// adding it for admin security - safeer 3
    // Validate request type
if (!['od', 'booking'].includes(payload.type)) {
  return res.status(400).json({
    message: 'Invalid request type.'
  });
}

// Only the Secretary can create hall bookings
if (
  payload.type === 'booking' &&
  req.user.role !== 'secretary'
) {
  return res.status(403).json({
    message: 'Only the Secretary can book event halls.'
  });
}

// Only students and the Secretary can apply for OD
if (
  payload.type === 'od' &&
  !['student', 'secretary'].includes(req.user.role)
) {
  return res.status(403).json({
    message: 'You are not permitted to apply for OD.'
  });
}
//----------------------------------------------------

    const isOd = payload.type === 'od';
    const prefix = isOd ? 'OD' : 'BK';
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const flow = isOd ? FLOWS.od : FLOWS[payload.kind];
    if (!flow) return res.status(400).json({ message: 'Invalid request type or kind.' });

    const newReq = await Request.create({
      id: payload.id || `${prefix}-${randomNum}`,
      type: payload.type,
      kind: payload.kind,
       applicantId: req.user.id,          
      createdAt: new Date().toISOString(),
       status: payload.status === 'Draft' ? 'Draft' : 'Pending',   
       // replacing it for admin security - safeer 4
      // approvals: payload.approvals || makeApprovals(flow),
      approvals: makeApprovals(flow),
      data: payload.data
    });

    if (newReq.status !== 'Draft') {                               // changed
  await Notification.create({
    id: `N-${Date.now()}`,
     role: newReq.approvals[0].role,
    text: `New ${isOd ? 'OD application' : 'room booking'} ${newReq.id} received.`,
    at: new Date().toISOString(),
    read: false
  });
}
   
    res.status(201).json(newReq);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/requests/:id/submit -> send a saved Draft for approval
app.post('/api/requests/:id/submit', requireAuth, async (req, res) => {
  try {
    const r = await Request.findOne({ id: req.params.id });
    if (!r) return res.status(404).json({ message: 'Request not found' });
    if (r.applicantId !== req.user.id) return res.status(403).json({ message: 'Not your request.' });
    if (r.status !== 'Draft') return res.status(400).json({ message: 'Only drafts can be submitted.' });

    r.status = 'Pending';
    await r.save();
    await Notification.create({
      id: `N-${Date.now()}`,
      role: r.approvals[0].role,
      text: `New ${r.type === 'od' ? 'OD application' : 'room booking'} ${r.id} received.`,
      at: new Date().toISOString(),
      read: false
    });
    res.json(r);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.post('/api/requests/:id/decision', requireAuth, async (req, res) => {
  try {
    const { decision, remarks = '' } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be "approve" or "reject".' });
    }
    if (decision === 'reject' && !String(remarks).trim()) {
      return res.status(400).json({ message: 'Please give a reason for rejecting.' });
    }
    const actor = req.user;

    const r = await Request.findOne({ id: req.params.id });
    if (!r) return res.status(404).json({ message: 'Request not found' });

    const i = r.status === 'Pending' ? r.approvals.findIndex(a => a.status === 'Pending') : -1;
    if (i < 0) return res.status(400).json({ message: `This request is already ${r.status}.` });

    // only the person whose turn it is may decide
    if (r.approvals[i].role !== actor.role) {
      return res.status(403).json({ message: 'It is not your turn to act on this request.' });
    }
        // tutors: only the tutor of the student's own section may act
    if (actor.role === 'tutor') {
      const [me, applicant] = await Promise.all([
        User.findOne({ id: actor.id }),
        User.findOne({ id: r.applicantId }),
      ]);
      if (me && me.section && applicant && applicant.section && applicant.section !== me.section) {
        return res.status(403).json({ message: 'This student belongs to another tutor section.' });
      }
    }

    r.approvals[i].status = decision === 'approve' ? 'Approved' : 'Rejected';
    r.approvals[i].by = actor.id;
    r.approvals[i].byName = actor.name;
    r.approvals[i].at = new Date().toISOString();
    r.approvals[i].remarks = String(remarks).trim();

    if (decision === 'reject') {
      r.status = 'Rejected';
    } else if (i + 1 < r.approvals.length) {
      r.approvals[i + 1].status = 'Pending';

      await Notification.create({
        id: `N-${Date.now()}`,
        role: r.approvals[i + 1].role,
        text: `${r.id} forwarded to you by ${actor.name}.`,
        at: new Date().toISOString(),
        read: false
      });
    } else {
      r.status = 'Approved';
    }

    await r.save();

    res.json(r);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// =========================================================
// 5. MASTER CRUD ROUTES
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
  // LIST (never send passwords to the client)
  app.get(`/api/${resource}`, async (req, res) => {
    try {
      const query = resource === 'users' ? model.find().select('-password') : model.find();
      res.json(await query);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // CREATE
  app.post(`/api/${resource}`, async (req, res) => {
    try {
      const count = await model.countDocuments();
      const newItem = await model.create({
        id: req.body.id || `${prefix}-${count + 1 + Math.floor(Math.random() * 100)}`,
        ...req.body
      });
      const out = newItem.toObject();
      if (resource === 'users') delete out.password;
      res.status(201).json(out);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // UPDATE
  app.put(`/api/${resource}/:id`, async (req, res) => {
    try {
      let body = { ...req.body };

      if (resource === 'users') {
        // Must be logged in; non-admins can only edit themselves, and never role/password/active
        if (!req.user) return res.status(401).json({ message: 'Please log in again.' });
        if (req.user.role !== 'admin') {
          if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Not allowed.' });
          }
          delete body.role;
          delete body.password;
          delete body.active;
          delete body.id;
        }
      }

      const updated = await model.findOneAndUpdate({ id: req.params.id }, body, { new: true });
      if (!updated) return res.status(404).json({ message: 'Not found' });

      const out = updated.toObject();
      if (resource === 'users') delete out.password;
      res.json(out);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // DELETE
  app.delete(`/api/${resource}/:id`, async (req, res) => {
    try {
      await model.findOneAndDelete({ id: req.params.id });
      res.json({ message: 'Deleted', id: req.params.id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
});

// =========================================================
// 6. NOTIFICATION ROUTES
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
// 7. AUTO-SEED INITIAL DATA (data lives in ./seed and ./workflow.js)
// =========================================================
async function seedDatabaseIfEmpty() {
  if ((await User.countDocuments()) > 0) return;

  console.log('🌱 Database is empty! Auto-seeding with initial data...');

  const s = buildSeed();
  await User.insertMany(s.users);
  await Club.insertMany(s.clubs);
  await Association.insertMany(s.associations);
  await EventActivity.insertMany(s.events);
  await Department.insertMany(s.departments);
  await Room.insertMany(s.rooms);
  await Request.insertMany(s.requests);
  await Notification.insertMany(s.notifications);

  console.log('✅ Auto-seeding complete! All users, clubs, rooms, and requests are now in MongoDB.');
}

//added this functions

async function syncSecretary() {
  const secretary = await User.findOneAndUpdate(
    { regNo: '26MX332' },
    {
      $set: {
        role: 'secretary',
        designation: 'Student Secretary, MCA – I Year',
        section: 'G2',
      },
    },
    { returnDocument: 'after' }
  );

  if (!secretary) {
    console.log('Secretary student record not found!');
    return;
  }

  await User.updateOne(
    { id: 'S001' },
    {
      $set: {
        active: false,
        email: 'retired-secretary@college.edu',
        username: 'retired-secretary',
      },
    }
  );

  console.log('Secretary synced:', secretary.name);
}

async function syncStudentSections() {
  const students = buildSeed().users.filter(
    user => user.role === 'student'
  );

  for (const student of students) {
    await User.updateOne(
      { regNo: student.regNo, role: 'student' },
      {
        $set: {
          section: student.section,
        },
      }
    );
  }

  console.log('✅ Student sections synced successfully!');
}

//adding seperate function to chech faculty records

async function seedFacultyUsers() {
  console.log('🌱 Checking faculty records...');

  for (const faculty of facultyList) {
    await User.findOneAndUpdate(
      { id: faculty.id },
      { $set: faculty },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true,
      }
    );
  }

  console.log('✅ Faculty records synced successfully!');
}

// =========================================================
// 8. CONNECT TO MONGODB & START SERVER
// =========================================================
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB!');

    await seedDatabaseIfEmpty();
    // Student Section test after added
    await syncStudentSections();

    // Always sync faculty, even when students already exist
    await syncSecretary();

    await seedFacultyUsers();
    // await syncFacultyUsersPlaceholder();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Backend Server running at http://localhost:${PORT}/api`));
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
