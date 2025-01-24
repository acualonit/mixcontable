import React, { useState } from 'react';
import NuevoCargo from './NuevoCargo';
import { exportToExcel } from '../../utils/exportUtils';

function CargosEmpresa({ onBack }) {
  const [showNuevoCargo, setShowNuevoCargo] = useState(false);
  const [filtros, setFiltros] = useState({
    departamento: '',
    estado: ''
  });

  // Estado para la lista de cargos (ejemplo)
  const [cargos, setCargos] = useState([
    {
      id: 1,
      nombre: 'Gerente de Ventas',
      departamento: 'Ventas',
      descripcion: 'Responsable de liderar el equipo de ventas',
      requisitos: 'Experiencia mínima de 5 años en ventas',
      responsabilidades: 'Gestionar equipo, establecer metas, etc.',
      estado: 'activo',
      fechaCreacion: '2023-01-15'
    }
  ]);

  const handleNuevoCargo = (cargo) => {
    setCargos([...cargos, { 
      ...cargo, 
      id: cargos.length + 1,
      fechaCreacion: new Date().toISOString().split('T')[0]
    }]);
    setShowNuevoCargo(false);
  };

  const handleExportarExcel = () => {
    const dataToExport = cargos.map(cargo => ({
      'Nombre del Cargo': cargo.nombre,
      'Departamento': cargo.departamento,
      'Descripción': cargo.descripcion,
      'Requisitos': cargo.requisitos,
      'Responsabilidades': cargo.responsabilidades,
      'Estado': cargo.estado.charAt(0).toUpperCase() + cargo.estado.slice(1),
      'Fecha Creación': cargo.fechaCreacion
    }));

    exportToExcel(dataToExport, 'Cargos_Empresa');
  };

  // Filtrar cargos
  const cargosFiltrados = cargos.filter(cargo => {
    const cumpleDepartamento = !filtros.departamento || cargo.departamento === filtros.departamento;
    const cumpleEstado = !filtros.estado || cargo.estado === filtros.estado;
    return cumpleDepartamento && cumpleEstado;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Cargos de Empresa</h2>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoCargo(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Cargo
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
            <div className="col-md-6">
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
            <div className="col-md-6">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Cargos */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Lista de Cargos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Nombre del Cargo</th>
                  <th>Departamento</th>
                  <th>Descripción</th>
                  <th>Requisitos</th>
                  <th>Responsabilidades</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargosFiltrados.map((cargo) => (
                  <tr key={cargo.id}>
                    <td>{cargo.nombre}</td>
                    <td>{cargo.departamento}</td>
                    <td>{cargo.descripcion}</td>
                    <td>{cargo.requisitos}</td>
                    <td>{cargo.responsabilidades}</td>
                    <td>
                      <span className={`badge bg-${cargo.estado === 'activo' ? 'success' : 'danger'}`}>
                        {cargo.estado.charAt(0).toUpperCase() + cargo.estado.slice(1)}
                      </span>
                    </td>
                    <td>{cargo.fechaCreacion}</td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-warning"
                          title="Editar cargo"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          title="Eliminar cargo"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cargosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No se encontraron cargos con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Nuevo Cargo */}
      {showNuevoCargo && (
        <NuevoCargo 
          onClose={() => setShowNuevoCargo(false)}
          onSave={handleNuevoCargo}
        />
      )}
    </div>
  );
}

export default CargosEmpresa;