import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PATHS } from '../../routes/paths';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || PATHS.HOME} replace />;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(location.state?.from?.pathname || PATHS.HOME, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-md rounded-xl2 border border-slate-200 bg-white p-8 shadow-card">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Contract Online System" className="mb-4 h-16 w-16 object-contain" />
          <h1 className="text-xl font-bold text-navy">Contract Online System</h1>
          <p className="mt-1 text-sm text-slate-500">เข้าสู่ระบบเพื่อจัดการสัญญาของคุณ</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <AlertCircle size={17} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">USERNAME</span>
            <div className="relative">
              <User size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">PASSWORD</span>
            <div className="relative">
              <Lock size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="password"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <LogIn size={17} /> {loading ? 'กำลังเข้าสู่ระบบ...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
