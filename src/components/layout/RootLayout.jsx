import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-brand-100 text-navy">
      <Header />
      <Outlet />
    </div>
  );
}
