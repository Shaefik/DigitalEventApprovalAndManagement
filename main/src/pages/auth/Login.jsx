import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';

import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2
} from 'lucide-react';

import { motion } from 'framer-motion';
import { useApp } from '../../hooks/useApp';
import { Input } from '../../components/forms/Fields';

export default function Login() {

  const { user, login, db } = useApp();

  const [f, setF] = useState({
    identifier: '',
    password: ''
  });

  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <Navigate
        to={`/${user.role}/dashboard`}
        replace
      />
    );
  }

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
  };

  const validate = () => {
    const e = {};

    if (!f.identifier.trim()) {
      e.identifier = 'Enter your email or username.';
    }

    if (!f.password) {
      e.password = 'Enter your password.';
    }

    setErr(e);

    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const r = await login({
      identifier: f.identifier,
      password: f.password
    });

    setLoading(false);

    if (!r.ok) {
      setErr({ form: r.error });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* Left branding section */}

      <div className="hidden flex-col justify-between
                      bg-navy-900 p-12 text-white lg:flex">

        <div className="flex items-center gap-3">

          <div className="grid h-11 w-11 place-items-center
                          rounded-xl bg-indigo-500">
            <GraduationCap />
          </div>

          <b>{db.settings.collegeName}</b>

        </div>

        <div>

          <h2 className="max-w-md text-4xl font-extrabold
                         leading-tight">

            Permissions and event approvals,
            tracked at every desk.

          </h2>

          <p className="mt-4 max-w-md text-slate-300">

            Manage OD requests, hall bookings and
            approvals in one place.

          </p>

        </div>

        <p className="text-sm text-slate-400">
          Academic year {db.settings.academicYear}
        </p>

      </div>

      {/* Common login section */}

      <div className="flex items-center justify-center p-6">

        <motion.form
          onSubmit={submit}
          noValidate
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >

          <h1 className="text-2xl font-extrabold text-navy-900">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your dashboard.
          </p>

          <div className="mt-6 space-y-4">

            <Input
              label="Email or username"
              type="text"
              value={f.identifier}
              onChange={set('identifier')}
              error={err.identifier}
              autoComplete="username"
            />

            <div>

              <label className="label">
                Password
              </label>

              <div className="relative">

                <input
                  className={`input pr-10 ${
                    err.password ? 'border-red-400' : ''
                  }`}
                  type={show ? 'text' : 'password'}
                  value={f.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-2.5
                             text-slate-500"
                  aria-label="Show or hide password"
                >

                  {show
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }

                </button>

              </div>

              {err.password && (
                <p className="mt-1 text-xs text-red-600">
                  {err.password}
                </p>
              )}

            </div>

            <div className="flex justify-end">
  <Link
    to="/forgot-password"
    className="text-sm font-semibold text-indigo-600 hover:underline"
  >
    Forgot Password?
  </Link>
</div>

            {err.form && (

              <p className="rounded-lg bg-red-50
                            p-2 text-sm text-red-700">
                {err.form}
              </p>
            )}

            <button
              className="btn-primary w-full"
              disabled={loading}
            >

              {loading && (
                <Loader2
                  className="animate-spin"
                  size={16}
                />
              )}

              {loading ? 'Please wait…' : 'Sign in'}

            </button>

            <p className="text-center text-xs text-slate-500">
              Use your registered account credentials.
            </p>

          </div>

        </motion.form>

      </div>

    </div>
  );
}