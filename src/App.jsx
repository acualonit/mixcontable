import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
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

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Router>
      <div>
        <Header 
          onToggleSidebar={toggleSidebar} 
        />
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
        />
        <div className={`main-content content-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/principal" />} />
            <Route path="/principal" element={<Principal currentDateTime={format(currentDateTime, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })} />} />
            <Route path="/flujo-caja" element={<FlujoCaja />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/efectivo" element={<Efectivo />} />
            <Route path="/compras" element={<ComprasInsumos />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/cuentas-cobrar" element={<CuentasXCobrar />} />
            <Route path="/cuentas-pagar" element={<CuentasXPagar />} />
            <Route path="/servicios" element={<ServiciosMes />} />
            <Route path="/recurrente" element={<RecurrenteEgreso />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/personal" element={<Personal />} />
            <Route path="/nomina" element={<Nomina />} />
            <Route path="/banco" element={<Banco />} />
            <Route path="/cheques" element={<Cheques />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/activos" element={<Activos />} />
            <Route path="/eliminar" element={<Eliminar />} />
            <Route path="/otros-ingresos" element={<OtrosIngresos />} />
            <Route path="/otros-egresos" element={<OtrosEgresos />} />
            <Route path="/personaliza" element={<Personaliza />} />
            <Route path="/informes" element={<Informes />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;