import { Navigate, useParams } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { NAV } from '../utils/roles';
import Dashboard from '../pages/shared/Dashboard';
import ODForm from '../pages/shared/ODForm';
import BookingForm from '../pages/shared/BookingForm';
import RequestList from '../pages/shared/RequestList';
import Settings from '../pages/shared/Settings';
import UserManagement from '../pages/admin/UserManagement';
import MasterPage, { MASTERS } from '../pages/admin/MasterPage';

// Blocks users from opening another role's dashboard.
export function Protected({ children }) {
  const { user } = useApp();
  const { role } = useParams();
  if (!user) return <Navigate to="/login" replace />;
  if (role !== user.role) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
}

export function PageSwitch() {
  const { user } = useApp();
  const { page } = useParams();
  if (!NAV[user.role].some((n) => n.page === page)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  const mode = user.role === 'admin' ? 'all' : 'mine';
  switch (page) {
    case 'dashboard': return <Dashboard />;
    case 'od-new': return <ODForm />;
    case 'bk-new': return <BookingForm />;
    case 'od-list': return <RequestList type="od" mode={mode} />;
    case 'bk-list': return <RequestList type="booking" mode={mode} />;
    case 'od-queue': return <RequestList type="od" mode="queue" />;
    case 'bk-queue': return <RequestList type="booking" mode="queue" />;
    case 'users': return <UserManagement />;
    case 'settings': return <Settings />;
    default: return MASTERS[page] ? <MasterPage key={page} type={page} /> : <Navigate to="dashboard" replace />;
  }
}
