import React, { useState } from 'react';
import NuevoProveedor from '../components/proveedores/NuevoProveedor';
import DetalleProveedor from '../components/proveedores/DetalleProveedor';
import EditarProveedor from '../components/proveedores/EditarProveedor';
import { exportToExcel } from '../utils/exportUtils';

function Proveedores() {
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    ciudad: ''
  });

  // Datos de ejemplo para proveedores
  const [proveedores] = useState([
    {
      id: 1,
      rut: '76.543.210-K',
      razonSocial: 'Proveedor A Ltda.',
      nombreFantasia: 'Proveedor A',
      giro: 'Venta de Insumos',
      ciudad: 'Santiago',
      contactoPrincipal: 'María González',
      telefonoPrincipal: '+56 9 8765 4321',
      emailPrincipal: 'contacto@proveedora.cl',
      condicionPago: '30',
      estado: 'activo'
    }
  ]);

  const handleExportarExcel = () => {
    const dataToExport = proveedores.map(proveedor => ({
      RUT: proveedor.rut,
      'Razón Social': proveedor.razonSocial,
      'Nombre Fantasía': proveedor.nombreFantasia || '-',
      'Giro': proveedor.giro,
      'Ciudad': proveedor.ciudad,
      'Contacto': proveedor.contactoPrincipal,
      'Teléfono': proveedor.telefonoPrincipal,
      'Email': proveedor.emailPrincipal,
      'Condición Pago': proveedor.condicionPago === '0' ? 'Contado' : `${proveedor.condicionPago} días`,
      'Estado': proveedor.estado.charAt(0).toUpperCase() + proveedor.estado.slice(1)
    }));

    exportToExcel(dataToExport, 'Proveedores');
  };

  // Obtener ciudades únicas para el filtro
  const ciudadesUnicas = [...new Set(proveedores.map(proveedor => proveedor.ciudad))];

  // Filtrar proveedores
  const proveedoresFiltrados = proveedores.filter(proveedor => {
    const cumpleBusqueda = !filtros.busqueda || 
      proveedor.rut.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      proveedor.razonSocial.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (proveedor.nombreFantasia && proveedor.nombreFantasia.toLowerCase().includes(filtros.busqueda.toLowerCase()));
    
    const cumpleEstado = !filtros.estado || proveedor.estado === filtros.estado;
    const cumpleCiudad = !filtros.ciudad || proveedor.ciudad === filtros.ciudad;

    return cumpleBusqueda && cumpleEstado && cumpleCiudad;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Proveedores</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoProveedor(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Proveedor
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
            <div className="col-md-3 mb-3">
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
            <div className="col-md-3 mb-3">
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

      {/* Resumen de Proveedores */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Total Proveedores</h6>
              <h3>{proveedores.length}</h3>
              <small>Proveedores registrados</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Proveedores Activos</h6>
              <h3>{proveedores.filter(p => p.estado === 'activo').length}</h3>
              <small>En operación</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Nuevos este Mes</h6>
              <h3>0</h3>
              <small>Últimos 30 días</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Inactivos</h6>
              <h3>{proveedores.filter(p => p.estado === 'inactivo').length}</h3>
              <small>Sin operación</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Lista de Proveedores</h5>
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
                {proveedoresFiltrados.map((proveedor) => (
                  <tr key={proveedor.id}>
                    <td>{proveedor.rut}</td>
                    <td>{proveedor.razonSocial}</td>
                    <td>{proveedor.nombreFantasia || '-'}</td>
                    <td>{proveedor.giro}</td>
                    <td>{proveedor.ciudad}</td>
                    <td>{proveedor.contactoPrincipal}</td>
                    <td>{proveedor.telefonoPrincipal}</td>
                    <td>{proveedor.emailPrincipal}</td>
                    <td>
                      <span className={`badge bg-${proveedor.estado === 'activo' ? 'success' : 'danger'}`}>
                        {proveedor.estado.charAt(0).toUpperCase() + proveedor.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowDetalle(true);
                          }}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowEditar(true);
                          }}
                          title="Editar proveedor"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {proveedor.estado === 'activo' && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              if (window.confirm('¿Está seguro de inactivar este proveedor?')) {
                                // Aquí iría la lógica para inactivar el proveedor
                                console.log('Inactivar proveedor:', proveedor.id);
                              }
                            }}
                            title="Inactivar proveedor"
                          >
                            <i className="bi bi-person-x"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {proveedoresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center">
                      No se encontraron proveedores con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevoProveedor && (
        <NuevoProveedor 
          onClose={() => setShowNuevoProveedor(false)}
          onSave={(data) => {
            console.log('Nuevo proveedor:', data);
            setShowNuevoProveedor(false);
          }}
        />
      )}

      {showDetalle && proveedorSeleccionado && (
        <DetalleProveedor
          proveedor={proveedorSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setProveedorSeleccionado(null);
          }}
        />
      )}

      {showEditar && proveedorSeleccionado && (
        <EditarProveedor
          proveedor={proveedorSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setProveedorSeleccionado(null);
          }}
          onSave={(proveedorEditado) => {
            console.log('Proveedor editado:', proveedorEditado);
            setShowEditar(false);
            setProveedorSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default Proveedores;