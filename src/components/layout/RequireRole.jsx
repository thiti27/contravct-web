import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PATHS } from '../../routes/paths';

// Gates an entire route subtree behind a permission flag on the logged-in user
// (e.g. user.admin for /settings, user.legal for /legal). Sits inside RequireAuth,
// so by the time this runs the user is already known to be logged in — this only
// decides whether *this* section is allowed, redirecting to /unauthorized otherwise.
export default function RequireRole({ allow }) {
  const { user } = useAuth();
  if (!allow(user)) return <Navigate to={PATHS.UNAUTHORIZED} replace />;
  return <Outlet />;
}
