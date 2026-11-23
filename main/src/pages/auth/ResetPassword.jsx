import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { Input } from '../../components/forms/Fields';
import { authAPI } from '../../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const nav = useNavigate();
  const { toast } = useApp();
  const [pw, setPw] = useState({ next: '', again: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.next.length < 6) return setErr('Password must be at least 6 characters.');
    if (pw.next !== pw.again) return setErr('Passwords do not match.');
    setErr(''); setLoading(true);
    try {
      await authAPI.resetPassword(token, pw.next);
      toast('Password changed. You can now sign in.');
      nav('/login', { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not reset the password.');
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <form onSubmit={submit} noValidate className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-extrabold text-navy-900">Set a new password</h1>
        {!token ? (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">This link is not valid. Please request a new reset email.</p>
        ) : (
          <>
            <Input label="New password" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <Input label="Confirm new password" type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
            {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" size={16} />}{loading ? 'Please wait…' : 'Change password'}</button>
          </>
        )}
        <Link to="/login" className="block text-center text-sm font-semibold text-indigo-600">Back to sign in</Link>
      </form>
    </div>
  );
}