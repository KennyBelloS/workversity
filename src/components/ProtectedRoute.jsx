import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CargaBento from './CargaBento';

export default function ProtectedRoute({ children }) {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return <CargaBento pantallaCompleta />;
  }

  if (!autenticado) return <Navigate to="/login" replace />;

  return children;
}
