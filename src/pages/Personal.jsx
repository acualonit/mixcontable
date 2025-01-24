import React, { useState } from 'react';
import NuevoEmpleado from '../components/personal/NuevoEmpleado';
import DetalleEmpleado from '../components/personal/DetalleEmpleado';
import EditarEmpleado from '../components/personal/EditarEmpleado';
import CargosEmpresa from '../components/personal/CargosEmpresa';
import { exportToExcel } from '../utils/exportUtils';

function Personal() {
  const [showNuevoEmpleado, setShowNuevoEmpleado] = useState(false);
  const [showCargosEmpresa, setShowCargosEmpresa] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    departamento: '',
    cargo: '',
    sucursal: '',
    estado: ''
  });

  const [empleados, setEmpleados] = useState([
    {
      id: 1,
      rut: '12.345.678-9',
      nombre: 'Juan Pérez',
      cargo: 'Vendedor',
      departamento: 'Ventas',
      sucursal: 'Central',
      fechaIngreso: '2023-01-15',
      estado: 'activo'
    }
  ]);

  const [cargos, setCargos] = useState([]);

  const handleNuevoEmpleado = (empleado) => {
    setEmpleados([...empleados, { ...empleado, id: empleados.length + 1 }]);
    setShowNuevoEmpleado(false);
  };

  const handleVerDetalle = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setShowDetalle(true);
  };

  const handleEditar = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setShowEditar(true);
  };

  const handleExportarExcel = () => {
    const dataToExport = empleados.map(empleado => ({
      RUT: empleado.rut,
      Nombre: empleado.nombre,
      Cargo: empleado.cargo,
      Departamento: empleado.departamento,
      Sucursal: empleado.sucursal,
      'Fecha Ingreso': empleado.fechaIngreso,
      Estado: empleado.estado.charAt(0).toUpperCase() + empleado.estado.slice(1)
    }));

    exportToExcel(dataToExport, 'Personal');
  };

  const empleadosFiltrados = empleados.filter(empleado => {
    const cumpleBusqueda = !filtros.busqueda || 
      empleado.rut.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      empleado.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const cumpleDepartamento = !filtros.departamento || empleado.departamento === filtros.departamento;
    const cumpleCargo = !filtros.cargo || empleado.cargo === filtros.cargo;
    const cumpleSucursal = !filtros.sucursal || empleado.sucursal === filtros.sucursal;
    const cumpleEstado = !filtros.estado || empleado.estado === filtros.estado;

    return cumpleBusqueda && cumpleDepartamento && cumpleCargo && cumpleSucursal && cumpleEstado;
  });

  if (showCargosEmpresa) {
    return <CargosEmpresa onBack={() => setShowCargosEmpresa(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Personal</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoEmpleado(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Empleado
          </button>
          <button 
            className="btn btn-info"
            onClick={() => setShowCargosEmpresa(true)}
          >
            <i className="bi bi-briefcase me-2"></i>
            Cargos de Empresa
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
            <div className="col-md-4 mb-3">
              <label className="form-label">Buscar</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por RUT o nombre..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Departamento</label>
              <select
                className="form-select"
                value={filtros.departamento}
                onChange={(e) => setFiltros({...filtros, departamento: e.target.value})}
              >
                <option value="">Todos los departamentos</option>
                <option value="Administración">Administración</option>
                <option value="Ventas">Ventas</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Logística">Logística</option>
                <option value="Marketing">Marketing</option>
                <option value="TI">TI</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Cargo</label>
              <select
                className="form-select"
                value={filtros.cargo}
                onChange={(e) => setFiltros({...filtros, cargo: e.target.value})}
              >
                <option value="">Todos los cargos</option>
                <option value="Gerente">Gerente</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Operario">Operario</option>
                <option value="Técnico">Técnico</option>
                <option value="Analista">Analista</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Sucursal</label>
              <select
                className="form-select"
                value={filtros.sucursal}
                onChange={(e) => setFiltros({...filtros, sucursal: e.target.value})}
              >
                <option value="">Todas las sucursales</option>
                <option value="Central">Sucursal Central</option>
                <option value="Norte">Sucursal Norte</option>
                <option value="Sur">Sucursal Sur</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="vacaciones">Vacaciones</option>
                <option value="licencia">Licencia</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Personal */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Lista de Personal</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th>Cargo</th>
                  <th>Departamento</th>
                  <th>Sucursal</th>
                  <th>Fecha Ingreso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id}>
                    <td>{empleado.rut}</td>
                    <td>{empleado.nombre}</td>
                    <td>{empleado.cargo}</td>
                    <td>{empleado.departamento}</td>
                    <td>{empleado.sucursal}</td>
                    <td>{empleado.fechaIngreso}</td>
                    <td>
                      <span className={`badge bg-${
                        empleado.estado === 'activo' ? 'success' :
                        empleado.estado === 'inactivo' ? 'danger' :
                        empleado.estado === 'vacaciones' ? 'info' :
                        empleado.estado === 'licencia' ? 'warning' :
                        'secondary'
                      }`}>
                        {empleado.estado.charAt(0).toUpperCase() + empleado.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(empleado)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(empleado)}
                          title="Editar empleado"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {empleadosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No se encontraron empleados con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevoEmpleado && (
        <NuevoEmpleado 
          onClose={() => setShowNuevoEmpleado(false)}
          onSave={handleNuevoEmpleado}
        />
      )}

      {showDetalle && empleadoSeleccionado && (
        <DetalleEmpleado 
          empleado={empleadoSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setEmpleadoSeleccionado(null);
          }}
        />
      )}

      {showEditar && empleadoSeleccionado && (
        <EditarEmpleado
          empleado={empleadoSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setEmpleadoSeleccionado(null);
          }}
          onSave={(empleadoEditado) => {
            setEmpleados(empleados.map(emp => 
              emp.id === empleadoEditado.id ? empleadoEditado : emp
            ));
            setShowEditar(false);
            setEmpleadoSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default Personal;