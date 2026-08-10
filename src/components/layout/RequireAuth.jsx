import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PATHS } from '../../routes/paths';

export default function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  return <Outlet />;
}
