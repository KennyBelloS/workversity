import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';

// Cada pantalla se descarga solo cuando se usa (la app carga más rápido).
// El Service Worker las guarda todas al instalar, así también abren sin internet.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Ayuda = lazy(() => import('./pages/Ayuda'));
const EspacioTarea = lazy(() => import('./pages/EspacioTarea'));
const Resumen = lazy(() => import('./pages/Resumen'));
const Tareas = lazy(() => import('./pages/Tareas'));
const Horario = lazy(() => import('./pages/Horario'));
const Finanzas = lazy(() => import('./pages/Finanzas'));
const Materias = lazy(() => import('./pages/Materias'));
const Metas = lazy(() => import('./pages/Metas'));
const Parciales = lazy(() => import('./pages/Parciales'));
const Parcial = lazy(() => import('./pages/Parcial'));
const Grupo = lazy(() => import('./pages/Grupo'));
const Analitica = lazy(() => import('./pages/Analitica'));
const Configuracion = lazy(() => import('./pages/Configuracion'));

function Cargando() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}

function Pagina({ titulo, children }) {
  return (
    <ProtectedRoute>
      <Layout titulo={titulo}>
        <Suspense fallback={<Cargando />}>{children}</Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/enfoque/:id" element={<ProtectedRoute><Suspense fallback={<Cargando />}><EspacioTarea /></Suspense></ProtectedRoute>} />
      <Route path="/" element={<Pagina titulo="Dashboard"><Dashboard /></Pagina>} />
      <Route path="/ayuda" element={<Pagina titulo="Cómo se usa"><Ayuda /></Pagina>} />
      <Route path="/resumen" element={<Pagina titulo="Resumen"><Resumen /></Pagina>} />
      <Route path="/tareas" element={<Pagina titulo="Tareas"><Tareas /></Pagina>} />
      <Route path="/horario" element={<Pagina titulo="Agenda"><Horario /></Pagina>} />
      <Route path="/finanzas" element={<Pagina titulo="Finanzas"><Finanzas /></Pagina>} />
      <Route path="/materias" element={<Pagina titulo="Materias"><Materias /></Pagina>} />
      <Route path="/metas" element={<Pagina titulo="Metas"><Metas /></Pagina>} />
      <Route path="/parciales" element={<Pagina titulo="Parciales"><Parciales /></Pagina>} />
      <Route path="/parciales/:id" element={<Pagina titulo="Parcial"><Parcial /></Pagina>} />
      <Route path="/grupo" element={<Pagina titulo="Grupo"><Grupo /></Pagina>} />
      <Route path="/analitica" element={<Pagina titulo="Asistente inteligente"><Analitica /></Pagina>} />
      <Route path="/configuracion" element={<Pagina titulo="Configuración"><Configuracion /></Pagina>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
