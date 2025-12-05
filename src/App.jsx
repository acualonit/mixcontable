import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Principal from './pages/Principal';
import FlujoCaja from './pages/FlujoCaja';
import Ventas from './pages/Ventas';
import Efectivo from './pages/Efectivo';
import ComprasInsumos from './pages/ComprasInsumos';
import Gastos from './pages/Gastos';
import CuentasXCobrar from './pages/CuentasXCobrar';
import CuentasXPagar from './pages/CuentasXPagar';
import ServiciosMes from './pages/ServiciosMes';
import RecurrenteEgreso from './pages/RecurrenteEgreso';
import Clientes from './pages/Clientes';
import Personal from './pages/Personal';
import Nomina from './pages/Nomina';
import Banco from './pages/Banco';
import Cheques from './pages/Cheques';
import Proveedores from './pages/Proveedores';
import Activos from './pages/Activos';
import Eliminar from './pages/Eliminar';
import OtrosIngresos from './pages/OtrosIngresos';
import OtrosEgresos from './pages/OtrosEgresos';
import Personaliza from './pages/Personaliza';
import Informes from './pages/Informes';
import Configuracion from './pages/Configuracion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSavedUser, clearUser, logout as apiLogout } from './utils/authApi';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [user, setUser] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    const saved = getSavedUser();
    if (saved) {
      setUser(saved);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    } finally {
      clearUser();
      setUser(null);
    }
  };

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  const formattedDate = format(currentDateTime, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  const routeDefinitions = [
    { id: 'principal', path: '/principal', element: <Principal currentDateTime={formattedDate} /> },
    { id: 'flujo-caja', path: '/flujo-caja', element: <FlujoCaja /> },
    { id: 'ventas', path: '/ventas', element: <Ventas /> },
    { id: 'efectivo', path: '/efectivo', element: <Efectivo /> },
    { id: 'compras', path: '/compras', element: <ComprasInsumos /> },
    { id: 'gastos', path: '/gastos', element: <Gastos /> },
    { id: 'cuentas-cobrar', path: '/cuentas-cobrar', element: <CuentasXCobrar /> },
    { id: 'cuentas-pagar', path: '/cuentas-pagar', element: <CuentasXPagar /> },
    { id: 'servicios', path: '/servicios', element: <ServiciosMes /> },
    { id: 'recurrente', path: '/recurrente', element: <RecurrenteEgreso /> },
    { id: 'clientes', path: '/clientes', element: <Clientes /> },
    { id: 'personal', path: '/personal', element: <Personal /> },
    { id: 'nomina', path: '/nomina', element: <Nomina /> },
    { id: 'banco', path: '/banco', element: <Banco /> },
    { id: 'cheques', path: '/cheques', element: <Cheques /> },
    { id: 'proveedores', path: '/proveedores', element: <Proveedores /> },
    { id: 'activos', path: '/activos', element: <Activos /> },
    { id: 'eliminar', path: '/eliminar', element: <Eliminar /> },
    { id: 'otros-ingresos', path: '/otros-ingresos', element: <OtrosIngresos /> },
    { id: 'otros-egresos', path: '/otros-egresos', element: <OtrosEgresos /> },
    { id: 'personaliza', path: '/personaliza', element: <Personaliza /> },
    { id: 'informes', path: '/informes', element: <Informes /> },
    { id: 'configuracion', path: '/configuracion', element: <Configuracion /> },
  ];

  const allRouteIds = routeDefinitions.map((route) => route.id);
  const rolePermissions = {
    ADMINISTRADOR: allRouteIds,
    VENDEDOR: ['ventas', 'cuentas-pagar', 'cuentas-cobrar'],
    SUPERVISOR: allRouteIds.filter((id) => !['configuracion', 'activos'].includes(id)),
  };

  const allowedIds = rolePermissions[user.role] || [];
  const allowedSet = new Set(allowedIds);
  const allowedRoutes = routeDefinitions.filter((route) => allowedSet.has(route.id));
  const defaultRoute = allowedRoutes[0]?.path || '/principal';

  if (!allowedIds.length) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <h2>No tienes módulos asignados.</h2>
          <p>Contacta al administrador para que te habilite permisos.</p>
          <button className="btn btn-primary" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  const canAccess = (routeId) => allowedSet.has(routeId);

  return (
    <Router>
      <div>
        <Header 
          user={user}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          allowedMenuIds={allowedIds}
        />
        <div className={`main-content content-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
            {routeDefinitions.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={canAccess(route.id) ? route.element : <Navigate to={defaultRoute} replace />}
              />
            ))}
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;