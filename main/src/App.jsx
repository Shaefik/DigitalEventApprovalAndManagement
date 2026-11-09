import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/auth/Login';
import Layout from './components/layout/Layout';
import Toaster from './components/common/Toaster';
import { PageSwitch, Protected } from './routes';
import { useApp } from './hooks/useApp';

export default function App() {
  const { user } = useApp();
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/:role" element={<Protected><Layout /></Protected>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path=":page" element={<PageSwitch />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
