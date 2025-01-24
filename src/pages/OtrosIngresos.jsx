import React, { useState } from 'react';
import NuevoOtroIngreso from '../components/otros/NuevoOtroIngreso';
import DetalleOtroIngreso from '../components/otros/DetalleOtroIngreso';
import EditarOtroIngreso from '../components/otros/EditarOtroIngreso';
import { exportToExcel } from '../utils/exportUtils';

function OtrosIngresos() {
  const [showNuevoIngreso, setShowNuevoIngreso] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    fechaInicio: '',
    fechaFin: '',
    sucursal: ''
  });

  // Datos de ejemplo para otros ingresos
  const [ingresos, setIngresos] = useState([
    {
      id: 1,
      fecha: '2024-01-20',
      categoria: 'arriendos',
      descripcion: 'Arriendo Local Comercial',
      sucursal: 'Central',
      monto: 1200000,
      metodoPago: 'transferencia',
      comprobante: 'TR-001',
      estado: 'recibido',
      observaciones: 'Arriendo mensual local comercial centro',
      historial: [
        {
          fecha: '2024-01-20 10:30',
          usuario: 'Juan Pérez',
          accion: 'Creación',
          detalles: 'Registro inicial del ingreso'
        }
      ]
    }
  ]);

  const handleVerDetalle = (ingreso) => {
    setIngresoSeleccionado(ingreso);
    setShowDetalle(true);
  };

  const handleEditar = (ingreso) => {
    setIngresoSeleccionado(ingreso);
    setShowEditar(true);
  };

  const handleEliminar = (ingreso) => {
    if (window.confirm('¿Está seguro de eliminar este ingreso? Esta acción no se puede deshacer.')) {
      setIngresos(ingresos.filter(i => i.id !== ingreso.id));
    }
  };

  const handleGuardarIngreso = (ingresoData) => {
    const nuevoIngreso = {
      ...ingresoData,
      id: ingresos.length + 1,
      historial: [
        {
          fecha: new Date().toLocaleString(),
          usuario: 'Usuario Actual', // Esto debería venir del contexto de autenticación
          accion: 'Creación',
          detalles: 'Registro inicial del ingreso'
        }
      ]
    };
    setIngresos([...ingresos, nuevoIngreso]);
    setShowNuevoIngreso(false);
  };

  const handleGuardarEdicion = (ingresoEditado) => {
    setIngresos(ingresos.map(ingreso => 
      ingreso.id === ingresoEditado.id ? ingresoEditado : ingreso
    ));
    setShowEditar(false);
    setIngresoSeleccionado(null);
  };

  const handleExportarExcel = () => {
    const dataToExport = ingresos.map(ingreso => ({
      'Fecha': ingreso.fecha,
      'Categoría': ingreso.categoria.charAt(0).toUpperCase() + ingreso.categoria.slice(1),
      'Descripción': ingreso.descripcion,
      'Sucursal': ingreso.sucursal,
      'Monto': ingreso.monto,
      'Método de Pago': ingreso.metodoPago,
      'Comprobante': ingreso.comprobante || '-',
      'Estado': ingreso.estado.charAt(0).toUpperCase() + ingreso.estado.slice(1)
    }));

    exportToExcel(dataToExport, 'Otros_Ingresos');
  };

  // Filtrar ingresos
  const ingresosFiltrados = ingresos.filter(ingreso => {
    const cumpleCategoria = !filtros.categoria || ingreso.categoria === filtros.categoria;
    const cumpleFechaInicio = !filtros.fechaInicio || ingreso.fecha >= filtros.fechaInicio;
    const cumpleFechaFin = !filtros.fechaFin || ingreso.fecha <= filtros.fechaFin;
    const cumpleSucursal = !filtros.sucursal || ingreso.sucursal === filtros.sucursal;

    return cumpleCategoria && cumpleFechaInicio && cumpleFechaFin && cumpleSucursal;
  });

  // Calcular totales
  const totales = {
    totalIngresos: ingresosFiltrados.reduce((sum, ingreso) => sum + ingreso.monto, 0),
    totalRegistros: ingresosFiltrados.length,
    porCategoria: ingresosFiltrados.reduce((acc, ingreso) => {
      acc[ingreso.categoria] = (acc[ingreso.categoria] || 0) + ingreso.monto;
      return acc;
    }, {})
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Otros Ingresos</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-success"
            onClick={() => setShowNuevoIngreso(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Ingreso
          </button>
          <button 
            className="btn btn-primary"
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
            <div className="col-md-3">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={filtros.categoria}
                onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                <option value="arriendos">Arriendos</option>
                <option value="inversiones">Inversiones</option>
                <option value="comisiones">Comisiones</option>
                <option value="recuperacion">Recuperación de Gastos</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Sucursal</label>
              <select
                className="form-select"
                value={filtros.sucursal}
                onChange={(e) => setFiltros({...filtros, sucursal: e.target.value})}
              >
                <option value="">Todas las sucursales</option>
                <option value="central">Sucursal Central</option>
                <option value="norte">Sucursal Norte</option>
                <option value="sur">Sucursal Sur</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Total Otros Ingresos</h6>
              <h3>${totales.totalIngresos.toLocaleString()}</h3>
              <small>{totales.totalRegistros} registros</small>
            </div>
          </div>
        </div>
        {Object.entries(totales.porCategoria).map(([categoria, monto], index) => (
          <div key={categoria} className="col-md-4">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h6 className="card-title">
                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </h6>
                <h3>${monto.toLocaleString()}</h3>
                <small>
                  {((monto / totales.totalIngresos) * 100).toFixed(1)}% del total
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Otros Ingresos */}
      <div className="card">
        <div className="card-header bg-success text-white">
          <h5 className="card-title mb-0">Registro de Otros Ingresos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Sucursal</th>
                  <th>Monto</th>
                  <th>Método de Pago</th>
                  <th>Comprobante</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ingresosFiltrados.map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td>{ingreso.fecha}</td>
                    <td>{ingreso.categoria.charAt(0).toUpperCase() + ingreso.categoria.slice(1)}</td>
                    <td>{ingreso.descripcion}</td>
                    <td>{ingreso.sucursal}</td>
                    <td className="text-success">${ingreso.monto.toLocaleString()}</td>
                    <td>{ingreso.metodoPago}</td>
                    <td>{ingreso.comprobante || '-'}</td>
                    <td>
                      <span className={`badge bg-${ingreso.estado === 'recibido' ? 'success' : 'warning'}`}>
                        {ingreso.estado.charAt(0).toUpperCase() + ingreso.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(ingreso)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(ingreso)}
                          title="Editar ingreso"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleEliminar(ingreso)}
                          title="Eliminar ingreso"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ingresosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No se encontraron registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevoIngreso && (
        <NuevoOtroIngreso
          onClose={() => setShowNuevoIngreso(false)}
          onSave={handleGuardarIngreso}
        />
      )}

      {showDetalle && ingresoSeleccionado && (
        <DetalleOtroIngreso
          ingreso={ingresoSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setIngresoSeleccionado(null);
          }}
        />
      )}

      {showEditar && ingresoSeleccionado && (
        <EditarOtroIngreso
          ingreso={ingresoSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setIngresoSeleccionado(null);
          }}
          onSave={handleGuardarEdicion}
        />
      )}
    </div>
  );
}

export default OtrosIngresos;