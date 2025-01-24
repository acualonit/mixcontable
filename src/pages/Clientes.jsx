import React, { useState } from 'react';
import NuevoCliente from '../components/clientes/NuevoCliente';
import DetalleCliente from '../components/clientes/DetalleCliente';
import EditarCliente from '../components/clientes/EditarCliente';
import InactivarCliente from '../components/clientes/InactivarCliente';
import HistorialInactivos from '../components/clientes/HistorialInactivos';
import { exportToExcel } from '../utils/exportUtils';

function Clientes() {
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showInactivar, setShowInactivar] = useState(false);
  const [showHistorialInactivos, setShowHistorialInactivos] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estado para filtros y búsqueda
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    condicionVenta: '',
    ciudad: ''
  });

  // Estado para la lista de clientes
  const [clientes, setClientes] = useState([
    {
      id: 1,
      rut: '12.345.678-9',
      razonSocial: 'Empresa A SpA',
      nombreFantasia: 'Empresa A',
      giro: 'Comercio',
      ciudad: 'Santiago',
      contactoPrincipal: 'Juan Pérez',
      telefonoPrincipal: '+56 9 1234 5678',
      emailPrincipal: 'contacto@empresaa.cl',
      condicionVenta: '30',
      estado: 'activo',
      historialEstados: [
        {
          fecha: '2023-01-01',
          usuario: 'Admin',
          accion: 'Creación',
          detalles: 'Creación inicial del cliente'
        }
      ]
    },
    {
      id: 2,
      rut: '76.543.210-K',
      razonSocial: 'Comercial B Ltda',
      nombreFantasia: 'Comercial B',
      giro: 'Servicios',
      ciudad: 'Valparaíso',
      contactoPrincipal: 'María González',
      telefonoPrincipal: '+56 9 8765 4321',
      emailPrincipal: 'contacto@comercialb.cl',
      condicionVenta: '60',
      estado: 'activo',
      historialEstados: [
        {
          fecha: '2023-02-01',
          usuario: 'Admin',
          accion: 'Creación',
          detalles: 'Creación inicial del cliente'
        }
      ]
    }
  ]);

  // Función para filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro por búsqueda (RUT, Razón Social o Nombre Fantasía)
    const cumpleBusqueda = filtros.busqueda === '' || 
      cliente.rut.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      cliente.razonSocial.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (cliente.nombreFantasia && cliente.nombreFantasia.toLowerCase().includes(filtros.busqueda.toLowerCase()));

    // Filtro por estado
    const cumpleEstado = filtros.estado === '' || cliente.estado === filtros.estado;

    // Filtro por condición de venta
    const cumpleCondicionVenta = filtros.condicionVenta === '' || cliente.condicionVenta === filtros.condicionVenta;

    // Filtro por ciudad
    const cumpleCiudad = filtros.ciudad === '' || cliente.ciudad === filtros.ciudad;

    return cumpleBusqueda && cumpleEstado && cumpleCondicionVenta && cumpleCiudad;
  });

  // Obtener ciudades únicas para el filtro
  const ciudadesUnicas = [...new Set(clientes.map(cliente => cliente.ciudad))];

  const handleNuevoCliente = (cliente) => {
    setClientes([...clientes, { 
      ...cliente, 
      id: clientes.length + 1,
      estado: 'activo',
      historialEstados: [
        {
          fecha: new Date().toISOString(),
          usuario: 'Usuario Actual', // Esto debería venir del contexto de autenticación
          accion: 'Creación',
          detalles: 'Creación inicial del cliente'
        }
      ]
    }]);
  };

  const handleVerDetalle = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowDetalle(true);
  };

  const handleEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowEditar(true);
  };

  const handleGuardarEdicion = (clienteEditado) => {
    setClientes(clientes.map(cliente => 
      cliente.id === clienteEditado.id ? clienteEditado : cliente
    ));
    setShowEditar(false);
    setClienteSeleccionado(null);
  };

  const handleInactivar = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowInactivar(true);
  };

  const handleConfirmarInactivacion = (data) => {
    setClientes(clientes.map(cliente => {
      if (cliente.id === data.clienteId) {
        return {
          ...cliente,
          estado: 'inactivo',
          historialEstados: [
            ...cliente.historialEstados,
            {
              fecha: data.fecha,
              usuario: data.usuario,
              accion: 'Inactivación',
              detalles: data.observaciones
            }
          ]
        };
      }
      return cliente;
    }));
    setShowInactivar(false);
    setClienteSeleccionado(null);
  };

  const handleExportarExcel = () => {
    const dataToExport = clientesFiltrados.map(cliente => ({
      RUT: cliente.rut,
      'Razón Social': cliente.razonSocial,
      'Nombre Fantasía': cliente.nombreFantasia || '-',
      'Giro': cliente.giro,
      'Ciudad': cliente.ciudad,
      'Contacto': cliente.contactoPrincipal,
      'Teléfono': cliente.telefonoPrincipal,
      'Email': cliente.emailPrincipal,
      'Condición Venta': cliente.condicionVenta === '0' ? 'Contado' : `${cliente.condicionVenta} días`,
      'Estado': cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)
    }));

    exportToExcel(dataToExport, 'Clientes');
  };

  if (showHistorialInactivos) {
    return <HistorialInactivos onBack={() => setShowHistorialInactivos(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Clientes</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoCliente(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Cliente
          </button>
          <button 
            className="btn btn-info"
            onClick={() => setShowHistorialInactivos(true)}
          >
            <i className="bi bi-clock-history me-2"></i>
            Historial Inactivos
          </button>
          <button 
            className="btn btn-success"
            onClick={handleExportarExcel}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Buscar</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por RUT, Razón Social o Nombre Fantasía..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              />
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label">Condición Venta</label>
              <select
                className="form-select"
                value={filtros.condicionVenta}
                onChange={(e) => setFiltros({...filtros, condicionVenta: e.target.value})}
              >
                <option value="">Todas</option>
                <option value="0">Contado</option>
                <option value="30">30 días</option>
                <option value="45">45 días</option>
                <option value="60">60 días</option>
                <option value="90">90 días</option>
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label">Ciudad</label>
              <select
                className="form-select"
                value={filtros.ciudad}
                onChange={(e) => setFiltros({...filtros, ciudad: e.target.value})}
              >
                <option value="">Todas</option>
                {ciudadesUnicas.map((ciudad, index) => (
                  <option key={index} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Lista de Clientes</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>RUT</th>
                  <th>Razón Social</th>
                  <th>Nombre Fantasía</th>
                  <th>Giro</th>
                  <th>Ciudad</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.rut}</td>
                    <td>{cliente.razonSocial}</td>
                    <td>{cliente.nombreFantasia || '-'}</td>
                    <td>{cliente.giro}</td>
                    <td>{cliente.ciudad}</td>
                    <td>{cliente.contactoPrincipal}</td>
                    <td>{cliente.telefonoPrincipal}</td>
                    <td>{cliente.emailPrincipal}</td>
                    <td>
                      <span className={`badge bg-${cliente.estado === 'activo' ? 'success' : 'danger'}`}>
                        {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(cliente)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(cliente)}
                          title="Editar cliente"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {cliente.estado === 'activo' && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleInactivar(cliente)}
                            title="Inactivar cliente"
                          >
                            <i className="bi bi-person-x"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center">
                      No se encontraron clientes con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNuevoCliente && (
        <NuevoCliente 
          onClose={() => setShowNuevoCliente(false)}
          onSave={handleNuevoCliente}
        />
      )}

      {showDetalle && clienteSeleccionado && (
        <DetalleCliente 
          cliente={clienteSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setClienteSeleccionado(null);
          }}
        />
      )}

      {showEditar && clienteSeleccionado && (
        <EditarCliente
          cliente={clienteSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setClienteSeleccionado(null);
          }}
          onSave={handleGuardarEdicion}
        />
      )}

      {showInactivar && clienteSeleccionado && (
        <InactivarCliente
          cliente={clienteSeleccionado}
          onClose={() => {
            setShowInactivar(false);
            setClienteSeleccionado(null);
          }}
          onConfirm={handleConfirmarInactivacion}
        />
      )}
    </div>
  );
}

export default Clientes;