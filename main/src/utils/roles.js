// Role -> sidebar navigation. `page` keys are resolved in routes/index.jsx
const common = [{ page: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' }];
const settings = { page: 'settings', label: 'Settings', icon: 'Settings' };
const od = { page: 'od-queue', label: 'OD Approvals', icon: 'ClipboardCheck' };
const bk = { page: 'bk-queue', label: 'Booking Approvals', icon: 'CalendarCheck' };

export const NAV = {
  student: [...common, { page: 'od-new', label: 'Apply for OD', icon: 'FilePlus2' }, { page: 'od-list', label: 'My OD Applications', icon: 'ListChecks' }, settings],
  secretary: [...common, { page: 'od-new', label: 'Apply for OD', icon: 'FilePlus2' }, { page: 'od-list', label: 'OD Applications', icon: 'ListChecks' }, { page: 'bk-new', label: 'New Room Booking', icon: 'DoorOpen' }, { page: 'bk-list', label: 'Booking Tracking', icon: 'CalendarClock' }, settings],
  tutor: [...common, od, settings],
  'faculty-advisor': [...common, od, bk, settings],
  hod: [...common, bk, settings],
  'dean-su': [...common, bk, settings],
  'dean-admin': [...common, bk, settings],
  principal: [...common, bk, settings],
  admin: [
    ...common,
    { page: 'users', label: 'User Management', icon: 'Users' },
    { page: 'clubs', label: 'Clubs', icon: 'Trophy' },
    { page: 'associations', label: 'Associations', icon: 'Network' },
    { page: 'events', label: 'Event Activities', icon: 'PartyPopper' },
    { page: 'departments', label: 'Departments', icon: 'Building2' },
    { page: 'rooms', label: 'Rooms', icon: 'DoorOpen' },
    { page: 'od-list', label: 'All OD Requests', icon: 'ListChecks' },
    { page: 'bk-list', label: 'All Bookings', icon: 'CalendarClock' },
    settings,
  ],
};
