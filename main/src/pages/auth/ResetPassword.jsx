import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, LockKeyhole } from 'lucide-react';
import { authAPI } from '../../services/api';

export default function ResetPassword() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const sendOTP = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);

      setMessage(res.data.message);
      setOtp('');
      setStep(2);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to send OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      return setError('Enter a valid 6-digit OTP.');
    }

    if (password.length < 8) {
      return setError(
        'Password must be at least 8 characters.'
      );
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        email,
        otp,
        newPassword: password,
        confirmPassword
      });

      setOtp('');
      setPassword('');
      setConfirmPassword('');
      setStep(3);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to reset password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-5 flex justify-center">
          <div className="rounded-xl bg-indigo-100 p-4 text-indigo-600">
            {step === 1
              ? <Mail size={30} />
              : <LockKeyhole size={30} />}
          </div>
        </div>

        <h1 className="text-center text-2xl font-extrabold text-navy-900">
          {step === 1
            ? 'Forgot Password'
            : step === 2
            ? 'Reset Password'
            : 'Password Changed'}
        </h1>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
            {message}
          </p>
        )}

        {step === 1 && (
          <form onSubmit={sendOTP} className="mt-6 space-y-4">

            <p className="text-sm text-slate-500">
              Enter your registered email address
              to receive a verification code.
            </p>

            <label className="label">
              Registered Email
            </label>

            <input
              className="input w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <button
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 size={16} className="animate-spin" />
              )}

              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">

            <p className="text-sm text-slate-500">
              Check your email for the verification code.
              The OTP expires in 5 minutes.
            </p>

            <div>
              <label className="label">Enter OTP</label>

              <input
                className="input w-full text-center text-xl tracking-widest"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ''))
                }
                placeholder="000000"
                required
              />
            </div>

            <div>
              <label className="label">New Password</label>

              <input
                className="input w-full"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Confirm Password</label>

              <input
                className="input w-full"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) =>
                  setShowPassword(e.target.checked)
                }
              />
              Show password
            </label>

            <button
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 size={16} className="animate-spin" />
              )}

              {loading
                ? 'Resetting...'
                : 'Verify OTP & Reset Password'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={sendOTP}
              className="w-full text-sm font-semibold text-indigo-600"
            >
              Resend OTP
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep(1);
                setOtp('');
                setPassword('');
                setConfirmPassword('');
                setError('');
                setMessage('');
              }}
              className="w-full text-sm text-slate-500"
            >
              Change email address
            </button>

          </form>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4">

            <p className="rounded-lg bg-green-50 p-4 text-center text-green-700">
              Your password has been reset successfully.
              You can now sign in using your new password.
            </p>

            <button
              className="btn-primary w-full"
              onClick={() =>
                navigate('/login', { replace: true })
              }
            >
              Sign In
            </button>

          </div>
        )}

        {step !== 3 && (
          <Link
            to="/login"
            className="mt-6 block text-center text-sm font-semibold text-indigo-600"
          >
            Back to Sign In
          </Link>
        )}

      </div>
    </div>
  );
}