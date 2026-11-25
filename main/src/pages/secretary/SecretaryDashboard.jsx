import { Link } from 'react-router-dom';
import {
  FileText,
  DoorOpen,
  Clock,
  CheckCircle2,
  FilePlus2
} from 'lucide-react';

import { useApp } from '../../hooks/useApp';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { stageLabel } from '../../utils/workflow';
import { fmtDate } from '../../utils/helpers';

export default function SecretaryDashboard() {
  const { db, user } = useApp();

  const mine = db.requests.filter(
    (r) => r.applicantId === user.id
  );

  const odRequests = mine.filter(
    (r) => r.type === 'od'
  );

  const bookings = mine.filter(
    (r) => r.type === 'booking'
  );

  const pending = mine.filter(
    (r) => r.status === 'Pending'
  );

  const approved = mine.filter(
    (r) => r.status === 'Approved'
  );

  const recent = [...mine]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">

      {/* Welcome section */}

      <div>
        <h2 className="text-2xl font-extrabold text-navy-900">
          Welcome, {user.name}
        </h2>

        <p className="text-sm text-slate-500">
          Secretary Dashboard · {user.department}
        </p>
      </div>

      {/* Statistics */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="OD Requests"
          value={odRequests.length}
          icon={FileText}
          tone="navy"
        />

        <StatCard
          label="Hall Bookings"
          value={bookings.length}
          icon={DoorOpen}
          tone="navy"
        />

        <StatCard
          label="Pending Requests"
          value={pending.length}
          icon={Clock}
          tone="amber"
        />

        <StatCard
          label="Approved Requests"
          value={approved.length}
          icon={CheckCircle2}
          tone="green"
        />

      </div>

      {/* OD and Hall Booking sections */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="card p-6 space-y-4">

          <FileText size={32} />

          <h3 className="text-xl font-bold text-navy-900">
            OD Management
          </h3>

          <p className="text-sm text-slate-500">
            Apply for OD and track approval status.
          </p>

          <div className="flex flex-wrap gap-2">

            <Link
              to="/secretary/od-new"
              className="btn-primary"
            >
              <FilePlus2 size={16} />
              Apply for OD
            </Link>

            <Link
              to="/secretary/od-list"
              className="btn-ghost"
            >
              View OD Requests
            </Link>

          </div>

        </div>

        <div className="card p-6 space-y-4">

          <DoorOpen size={32} />

          <h3 className="text-xl font-bold text-navy-900">
            Hall Booking
          </h3>

          <p className="text-sm text-slate-500">
            Book event halls and track booking approvals.
          </p>

          <div className="flex flex-wrap gap-2">

            <Link
              to="/secretary/bk-new"
              className="btn-primary"
            >
              <DoorOpen size={16} />
              Book a Hall
            </Link>

            <Link
              to="/secretary/bk-list"
              className="btn-ghost"
            >
              View Bookings
            </Link>

          </div>

        </div>

      </div>

      {/* Recent requests */}

      <div className="card p-5">

        <h3 className="mb-3 font-bold text-navy-900">
          Recent Requests
        </h3>

        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">
            No requests submitted yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">

            {recent.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center
                           justify-between gap-2 py-3 text-sm"
              >

                <div>

                  <b>{r.id}</b> · {r.data.eventName}

                  <p className="text-xs text-slate-500">
                    {r.type === 'od'
                      ? 'OD Request'
                      : 'Hall Booking'}
                    {' · '}
                    {fmtDate(r.createdAt)}
                    {' · '}
                    Stage: {stageLabel(r)}
                  </p>

                </div>

                <StatusBadge status={r.status} />

              </li>
            ))}

          </ul>
        )}

      </div>

    </div>
  );
}