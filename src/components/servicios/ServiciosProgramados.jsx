import React, { useState } from 'react';
import EditarServicioProgramado from './EditarServicioProgramado';
import HistorialPagosServicio from './HistorialPagosServicio';

function ServiciosProgramados({ onBack }) {
  const [servicios, setServicios] = useState([
    {
      id: 1,
      servicio: 'Agua Potable',
      proveedor: 'Aguas Andinas',
      diaPago: 15,
      montoEstimado: 150000,
      estado: 'activo'
    }
  ]);

  const [showEditarServicio, setShowEditarServicio] = useState(false);
  const [showHistorialPagos, setShowHistorialPagos] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  const handleEditar = (servicio) => {
    setServicioSeleccionado(servicio);
    setShowEditarServicio(true);
  };

  const handlePausar = (servicio) => {
    if (window.confirm(`¿Está seguro de ${servicio.estado === 'activo' ? 'pausar' : 'activar'} este servicio?`)) {
      const nuevosServicios = servicios.map(s => {
        if (s.id === servicio.id) {
          return {
            ...s,
            estado: s.estado === 'activo' ? 'pausado' : 'activo'
          };
        }
        return s;
      });
      setServicios(nuevosServicios);
    }
  };

  const handleEliminar = (servicio) => {
    if (window.confirm('¿Está seguro de eliminar este servicio? Esta acción no se puede deshacer.')) {
      const nuevosServicios = servicios.filter(s => s.id !== servicio.id);
      setServicios(nuevosServicios);
    }
  };

  const handleVerHistorial = (servicio) => {
    setServicioSeleccionado(servicio);
    setShowHistorialPagos(true);
  };

  const handleGuardarEdicion = (servicioEditado) => {
    const nuevosServicios = servicios.map(s => {
      if (s.id === servicioEditado.id) {
        return servicioEditado;
      }
      return s;
    });
    setServicios(nuevosServicios);
    setShowEditarServicio(false);
    setServicioSeleccionado(null);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Servicios Programados</h2>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-info text-white">
          <h5 className="card-title mb-0">Lista de Servicios Programados</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Servicio</th>
                  <th>Proveedor</th>
                  <th>Día de Pago</th>
                  <th>Monto Estimado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td>{servicio.servicio}</td>
                    <td>{servicio.proveedor}</td>
                    <td>{servicio.diaPago}</td>
                    <td>${servicio.montoEstimado.toLocaleString()}</td>
                    <td>
                      <span className={`badge bg-${servicio.estado === 'activo' ? 'success' : 'warning'}`}>
                        {servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(servicio)}
                          title="Editar servicio"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => handlePausar(servicio)}
                          title={servicio.estado === 'activo' ? 'Pausar cobros' : 'Activar cobros'}
                        >
                          <i className={`bi bi-${servicio.estado === 'activo' ? 'pause' : 'play'}`}></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleEliminar(servicio)}
                          title="Eliminar servicio"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleVerHistorial(servicio)}
                          title="Ver historial de pagos"
                        >
                          <i className="bi bi-clock-history"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {servicios.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No hay servicios programados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditarServicio && servicioSeleccionado && (
        <EditarServicioProgramado
          servicio={servicioSeleccionado}
          onClose={() => {
            setShowEditarServicio(false);
            setServicioSeleccionado(null);
          }}
          onSave={handleGuardarEdicion}
        />
      )}

      {/* Modal de Historial de Pagos */}
      {showHistorialPagos && servicioSeleccionado && (
        <HistorialPagosServicio
          servicio={servicioSeleccionado}
          onClose={() => {
            setShowHistorialPagos(false);
            setServicioSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default ServiciosProgramados;