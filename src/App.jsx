import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { cerrarArranque } from './lib/arranque';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import NuevaClave from './pages/NuevaClave';
import CargaBento from './components/CargaBento';

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
const Apuntes = lazy(() => import('./pages/Apuntes'));
const Apunte = lazy(() => import('./pages/Apunte'));
const Analitica = lazy(() => import('./pages/Analitica'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Admin = lazy(() => import('./pages/Admin'));
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'));

function Cargando() {
  return <CargaBento texto="Cargando" />;
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
  // Cuando la sesión ya se resolvió, la pantalla de arranque completa su cifra y se retira.
  const { cargando } = useAuth();
  useEffect(() => { if (!cargando) cerrarArranque(); }, [cargando]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/nueva-clave" element={<NuevaClave />} />
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
      <Route path="/apuntes" element={<Pagina titulo="Apuntes"><Apuntes /></Pagina>} />
      <Route path="/apuntes/:id" element={<Pagina titulo="Apunte"><Apunte /></Pagina>} />
      <Route path="/analitica" element={<Pagina titulo="Asistente inteligente"><Analitica /></Pagina>} />
      <Route path="/configuracion" element={<Pagina titulo="Configuración"><Configuracion /></Pagina>} />
      <Route path="/admin" element={<Pagina titulo="Panel de administrador"><Admin /></Pagina>} />
      <Route path="*" element={<Suspense fallback={<Cargando />}><NoEncontrado /></Suspense>} />
    </Routes>
  );
}
