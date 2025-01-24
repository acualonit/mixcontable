import React, { useState } from 'react';
import NuevoOtroEgreso from '../components/otros/NuevoOtroEgreso';
import DetalleOtroEgreso from '../components/otros/DetalleOtroEgreso';
import EditarOtroEgreso from '../components/otros/EditarOtroEgreso';
import { exportToExcel } from '../utils/exportUtils';

function OtrosEgresos() {
  const [showNuevoEgreso, setShowNuevoEgreso] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [egresoSeleccionado, setEgresoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    fechaInicio: '',
    fechaFin: '',
    sucursal: ''
  });

  // Datos de ejemplo para otros egresos
  const [egresos, setEgresos] = useState([
    {
      id: 1,
      fecha: '2024-01-20',
      categoria: 'impuestos',
      descripcion: 'Pago IVA Mensual',
      sucursal: 'Central',
      monto: 500000,
      metodoPago: 'transferencia',
      comprobante: 'TR-001',
      estado: 'pagado',
      observaciones: 'Pago IVA período diciembre 2023',
      historial: [
        {
          fecha: '2024-01-20 10:30',
          usuario: 'Juan Pérez',
          accion: 'Creación',
          detalles: 'Registro inicial del egreso'
        }
      ]
    }
  ]);

  const handleVerDetalle = (egreso) => {
    setEgresoSeleccionado(egreso);
    setShowDetalle(true);
  };

  const handleEditar = (egreso) => {
    setEgresoSeleccionado(egreso);
    setShowEditar(true);
  };

  const handleEliminar = (egreso) => {
    if (window.confirm('¿Está seguro de eliminar este egreso? Esta acción no se puede deshacer.')) {
      setEgresos(egresos.filter(e => e.id !== egreso.id));
    }
  };

  const handleGuardarEgreso = (egresoData) => {
    const nuevoEgreso = {
      ...egresoData,
      id: egresos.length + 1,
      historial: [
        {
          fecha: new Date().toLocaleString(),
          usuario: 'Usuario Actual', // Esto debería venir del contexto de autenticación
          accion: 'Creación',
          detalles: 'Registro inicial del egreso'
        }
      ]
    };
    setEgresos([...egresos, nuevoEgreso]);
    setShowNuevoEgreso(false);
  };

  const handleGuardarEdicion = (egresoEditado) => {
    setEgresos(egresos.map(egreso => 
      egreso.id === egresoEditado.id ? egresoEditado : egreso
    ));
    setShowEditar(false);
    setEgresoSeleccionado(null);
  };

  const handleExportarExcel = () => {
    const dataToExport = egresos.map(egreso => ({
      'Fecha': egreso.fecha,
      'Categoría': egreso.categoria.charAt(0).toUpperCase() + egreso.categoria.slice(1),
      'Descripción': egreso.descripcion,
      'Sucursal': egreso.sucursal,
      'Monto': egreso.monto,
      'Método de Pago': egreso.metodoPago,
      'Comprobante': egreso.comprobante || '-',
      'Estado': egreso.estado.charAt(0).toUpperCase() + egreso.estado.slice(1)
    }));

    exportToExcel(dataToExport, 'Otros_Egresos');
  };

  // Filtrar egresos
  const egresosFiltrados = egresos.filter(egreso => {
    const cumpleCategoria = !filtros.categoria || egreso.categoria === filtros.categoria;
    const cumpleFechaInicio = !filtros.fechaInicio || egreso.fecha >= filtros.fechaInicio;
    const cumpleFechaFin = !filtros.fechaFin || egreso.fecha <= filtros.fechaFin;
    const cumpleSucursal = !filtros.sucursal || egreso.sucursal === filtros.sucursal;

    return cumpleCategoria && cumpleFechaInicio && cumpleFechaFin && cumpleSucursal;
  });

  // Calcular totales
  const totales = {
    totalEgresos: egresosFiltrados.reduce((sum, egreso) => sum + egreso.monto, 0),
    totalRegistros: egresosFiltrados.length,
    porCategoria: egresosFiltrados.reduce((acc, egreso) => {
      acc[egreso.categoria] = (acc[egreso.categoria] || 0) + egreso.monto;
      return acc;
    }, {})
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Otros Egresos</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-danger"
            onClick={() => setShowNuevoEgreso(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Egreso
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
                <option value="impuestos">Impuestos</option>
                <option value="seguros">Seguros</option>
                <option value="multas">Multas</option>
                <option value="donaciones">Donaciones</option>
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
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Total Otros Egresos</h6>
              <h3>${totales.totalEgresos.toLocaleString()}</h3>
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
                  {((monto / totales.totalEgresos) * 100).toFixed(1)}% del total
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Otros Egresos */}
      <div className="card">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">Registro de Otros Egresos</h5>
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
                {egresosFiltrados.map((egreso) => (
                  <tr key={egreso.id}>
                    <td>{egreso.fecha}</td>
                    <td>{egreso.categoria.charAt(0).toUpperCase() + egreso.categoria.slice(1)}</td>
                    <td>{egreso.descripcion}</td>
                    <td>{egreso.sucursal}</td>
                    <td className="text-danger">${egreso.monto.toLocaleString()}</td>
                    <td>{egreso.metodoPago}</td>
                    <td>{egreso.comprobante || '-'}</td>
                    <td>
                      <span className={`badge bg-${egreso.estado === 'pagado' ? 'success' : 'warning'}`}>
                        {egreso.estado.charAt(0).toUpperCase() + egreso.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(egreso)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(egreso)}
                          title="Editar egreso"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleEliminar(egreso)}
                          title="Eliminar egreso"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {egresosFiltrados.length === 0 && (
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
      {showNuevoEgreso && (
        <NuevoOtroEgreso
          onClose={() => setShowNuevoEgreso(false)}
          onSave={handleGuardarEgreso}
        />
      )}

      {showDetalle && egresoSeleccionado && (
        <DetalleOtroEgreso
          egreso={egresoSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setEgresoSeleccionado(null);
          }}
        />
      )}

      {showEditar && egresoSeleccionado && (
        <EditarOtroEgreso
          egreso={egresoSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setEgresoSeleccionado(null);
          }}
          onSave={handleGuardarEdicion}
        />
      )}
    </div>
  );
}

export default OtrosEgresos;