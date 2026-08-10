import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { PATHS } from '../../routes/paths';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4 bg-sky-50 px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500">
        <ShieldAlert size={32} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-navy">403 — Unauthorized</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          You don't have permission to access this page. Please contact an administrator if you believe this is a mistake.
        </p>
      </div>
      <Link
        to={PATHS.HOME}
        className="mt-2 inline-flex h-11 items-center rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
