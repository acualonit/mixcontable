import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { id: 'principal', title: 'Principal', icon: 'house', path: '/principal' },
  { id: 'ventas', title: 'Ventas', icon: 'cart-check', path: '/ventas' },
  { id: 'flujo-caja', title: 'Flujo de Caja', icon: 'cash-stack', path: '/flujo-caja' },
  { id: 'efectivo', title: 'Efectivo', icon: 'wallet2', path: '/efectivo' },
  { id: 'compras', title: 'Compras Insumos', icon: 'cart4', path: '/compras' },
  { id: 'gastos', title: 'Gastos', icon: 'receipt', path: '/gastos' },
  { id: 'cuentas-cobrar', title: 'Cuentas x Cobrar', icon: 'people', path: '/cuentas-cobrar' },
  { id: 'cuentas-pagar', title: 'Cuentas x Pagar', icon: 'credit-card', path: '/cuentas-pagar' },
  { id: 'servicios', title: 'Servicios Mes', icon: 'calendar-check', path: '/servicios' },
  { id: 'recurrente', title: 'Recurrente Egreso', icon: 'arrow-repeat', path: '/recurrente' },
  { id: 'clientes', title: 'Clientes', icon: 'person', path: '/clientes' },
  { id: 'personal', title: 'Personal', icon: 'person-lines-fill', path: '/personal' },
  { id: 'nomina', title: 'Nómina', icon: 'currency-exchange', path: '/nomina' },
  { id: 'banco', title: 'Banco', icon: 'bank', path: '/banco' },
  { id: 'cheques', title: 'Cheques', icon: 'journal-check', path: '/cheques' },
  { id: 'proveedores', title: 'Proveedores', icon: 'box', path: '/proveedores' },
  { id: 'activos', title: 'Activos', icon: 'box-seam', path: '/activos' },
  { id: 'eliminar', title: 'Eliminar', icon: 'trash', path: '/eliminar' },
  { id: 'otros-ingresos', title: 'Otros Ingresos', icon: 'arrow-up-circle', path: '/otros-ingresos' },
  { id: 'otros-egresos', title: 'Otros Egresos', icon: 'arrow-down-circle', path: '/otros-egresos' },
  { id: 'personaliza', title: 'Personaliza', icon: 'gear', path: '/personaliza' },
  { id: 'informes', title: 'Informes', icon: 'file-earmark-bar-graph', path: '/informes' },
  { id: 'configuracion', title: 'Configuración', icon: 'gear-fill', path: '/configuracion' }
];

function Sidebar({ isCollapsed, allowedMenuIds }) {
  const location = useLocation();
  const allowedSet = allowedMenuIds && allowedMenuIds.length > 0 ? new Set(allowedMenuIds) : null;
  const filteredItems = allowedSet ? menuItems.filter(item => allowedSet.has(item.id)) : menuItems;

  return (
    <div className={`sidebar d-flex flex-column ${isCollapsed ? 'collapsed' : ''}`}>
      <h4 className="text-center">Menu</h4>
      {filteredItems.map(item => (
        <Link
          key={item.id}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          <i className={`bi bi-${item.icon}`}></i>
          <span>{item.title}</span>
        </Link>
      ))}
    </div>
  );
}

export default Sidebar;