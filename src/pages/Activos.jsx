import React, { useState } from 'react';
import NuevoActivo from '../components/activos/NuevoActivo';
import DetalleActivo from '../components/activos/DetalleActivo';
import EditarActivo from '../components/activos/EditarActivo';
import MantenimientoActivo from '../components/activos/MantenimientoActivo';
import { exportToExcel } from '../utils/exportUtils';

function Activos() {
  const [showNuevoActivo, setShowNuevoActivo] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showMantenimiento, setShowMantenimiento] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    estado: '',
    sucursal: ''
  });

  // Estado para la lista de activos
  const [activos, setActivos] = useState([
    {
      id: 1,
      codigo: 'ACT-001',
      nombre: 'Computador Portátil',
      categoria: 'Equipos',
      marca: 'Dell',
      modelo: 'Latitude 5420',
      fechaAdquisicion: '2023-01-15',
      valorCompra: 1200000,
      sucursal: 'Central',
      responsable: 'Juan Pérez',
      estado: 'activo'
    }
  ]);

  // Filtrar activos según los filtros aplicados
  const activosFiltrados = activos.filter(activo => {
    const cumpleCategoria = !filtros.categoria || activo.categoria === filtros.categoria;
    const cumpleEstado = !filtros.estado || activo.estado === filtros.estado;
    const cumpleSucursal = !filtros.sucursal || activo.sucursal === filtros.sucursal;
    return cumpleCategoria && cumpleEstado && cumpleSucursal;
  });

  const handleVerDetalle = (activo) => {
    setActivoSeleccionado(activo);
    setShowDetalle(true);
  };

  const handleEditar = (activo) => {
    setActivoSeleccionado(activo);
    setShowEditar(true);
  };

  const handleMantenimiento = (activo) => {
    setActivoSeleccionado(activo);
    setShowMantenimiento(true);
  };

  const handleGuardarMantenimiento = (mantenimiento) => {
    // Actualizar el estado del activo si es necesario
    if (mantenimiento.estado === 'en_proceso') {
      setActivos(activos.map(act => 
        act.id === mantenimiento.activoId 
          ? { ...act, estado: 'en_mantenimiento' } 
          : act
      ));
    }
    
    setShowMantenimiento(false);
    setActivoSeleccionado(null);
  };

  const handleExportarExcel = () => {
    const dataToExport = activosFiltrados.map(activo => ({
      'Código': activo.codigo,
      'Nombre': activo.nombre,
      'Categoría': activo.categoria,
      'Marca': activo.marca,
      'Modelo': activo.modelo,
      'Fecha Adquisición': activo.fechaAdquisicion,
      'Valor': activo.valorCompra,
      'Sucursal': activo.sucursal,
      'Responsable': activo.responsable,
      'Estado': activo.estado.charAt(0).toUpperCase() + activo.estado.slice(1)
    }));

    exportToExcel(dataToExport, 'Activos');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Activos</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoActivo(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Activo
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
            <div className="col-md-4">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={filtros.categoria}
                onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                <option value="Equipos">Equipos</option>
                <option value="Muebles">Muebles</option>
                <option value="Vehículos">Vehículos</option>
                <option value="Maquinaria">Maquinaria</option>
                <option value="Herramientas">Herramientas</option>
                <option value="Software">Software</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="en_mantenimiento">En Mantenimiento</option>
                <option value="dado_de_baja">Dado de Baja</option>
                <option value="vendido">Vendido</option>
              </select>
            </div>
            <div className="col-md-4">
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
          </div>
        </div>
      </div>

      {/* Tabla de Activos */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Lista de Activos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Marca/Modelo</th>
                  <th>Fecha Adquisición</th>
                  <th>Valor</th>
                  <th>Sucursal</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activosFiltrados.map((activo) => (
                  <tr key={activo.id}>
                    <td>{activo.codigo}</td>
                    <td>{activo.nombre}</td>
                    <td>{activo.categoria}</td>
                    <td>{activo.marca} {activo.modelo}</td>
                    <td>{activo.fechaAdquisicion}</td>
                    <td>${activo.valorCompra.toLocaleString()}</td>
                    <td>{activo.sucursal}</td>
                    <td>{activo.responsable}</td>
                    <td>
                      <span className={`badge bg-${
                        activo.estado === 'activo' ? 'success' :
                        activo.estado === 'en_mantenimiento' ? 'warning' :
                        activo.estado === 'dado_de_baja' ? 'danger' :
                        'secondary'
                      }`}>
                        {activo.estado.charAt(0).toUpperCase() + activo.estado.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(activo)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(activo)}
                          title="Editar activo"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => handleMantenimiento(activo)}
                          title="Registrar mantenimiento"
                        >
                          <i className="bi bi-tools"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('¿Está seguro de dar de baja este activo?')) {
                              // Aquí iría la lógica para dar de baja el activo
                              console.log('Dar de baja activo:', activo.id);
                            }
                          }}
                          title="Dar de baja"
                          disabled={activo.estado === 'dado_de_baja'}
                        >
                          <i className="bi bi-archive"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center">
                      No se encontraron activos con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevoActivo && (
        <NuevoActivo 
          onClose={() => setShowNuevoActivo(false)}
          onSave={(activo) => {
            setActivos([...activos, { ...activo, id: activos.length + 1 }]);
            setShowNuevoActivo(false);
          }}
        />
      )}

      {showDetalle && activoSeleccionado && (
        <DetalleActivo 
          activo={activoSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setActivoSeleccionado(null);
          }}
        />
      )}

      {showEditar && activoSeleccionado && (
        <EditarActivo
          activo={activoSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setActivoSeleccionado(null);
          }}
          onSave={(activoEditado) => {
            setActivos(activos.map(act => 
              act.id === activoEditado.id ? activoEditado : act
            ));
            setShowEditar(false);
            setActivoSeleccionado(null);
          }}
        />
      )}

      {showMantenimiento && activoSeleccionado && (
        <MantenimientoActivo
          activo={activoSeleccionado}
          onClose={() => {
            setShowMantenimiento(false);
            setActivoSeleccionado(null);
          }}
          onSave={handleGuardarMantenimiento}
        />
      )}
    </div>
  );
}

export default Activos;