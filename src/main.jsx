import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { MetaProvider } from './context/MetaContext';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <MetaProvider>
      <RouterProvider router={router} />
    </MetaProvider>
  </AuthProvider>
);
