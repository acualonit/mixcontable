import React, { useState, useEffect } from 'react';
import { exportToExcel } from '../../utils/exportUtils';
import { fetchInactivos } from '../../utils/configApi';

function HistorialInactivos({ onBack }) {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    busqueda: ''
  });

  const [clientesInactivos, setClientesInactivos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInactivos();
        // Map backend keys to frontend fields expected by this component
        const adapt = (c) => {
          const lastHist = (c.historial_estados && c.historial_estados.length) ? c.historial_estados.slice(-1)[0] : null;
          let fecha = null;
          let hora = null;

          if (lastHist && lastHist.fecha && lastHist.accion && lastHist.accion.toLowerCase().includes('inactiv')) {
            const parts = lastHist.fecha.split(' ');
            fecha = parts[0] || null;
            hora = parts[1] || null;
          } else if (c.updated_at) {
            const parts = c.updated_at.split(' ');
            fecha = parts[0] || null;
            hora = parts[1] || null;
          }

          return {
            id: c.id,
            rut: c.rut,
            razonSocial: c.razon_social,
            nombreFantasia: c.nombre_fantasia,
            fechaInactivacion: fecha,
            horaInactivacion: hora,
            usuario: lastHist ? lastHist.usuario : '-',
            motivo: lastHist ? (lastHist.detalles || c.observacion) : c.observacion,
            historialEstados: c.historial_estados || [],
          };
        };

        setClientesInactivos((data || []).map(adapt));
      } catch (error) {
        console.error('Error cargando inactivos', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportarExcel = () => {
    const dataToExport = clientesInactivos.map(cliente => ({
      RUT: cliente.rut,
      'Razón Social': cliente.razonSocial,
      'Nombre Fantasía': cliente.nombreFantasia || '-',
      'Fecha Inactivación': cliente.fechaInactivacion,
      'Hora Inactivación': cliente.horaInactivacion,
      'Usuario': cliente.usuario,
      'Motivo': cliente.motivo
    }));

    exportToExcel(dataToExport, 'Historial_Clientes_Inactivos');
  };

  // Filtrar clientes según la búsqueda
  const clientesFiltrados = clientesInactivos.filter(cliente => {
    const cumpleBusqueda = !filtros.busqueda || 
      cliente.rut.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      cliente.razonSocial.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (cliente.nombreFantasia && cliente.nombreFantasia.toLowerCase().includes(filtros.busqueda.toLowerCase()));
    
    const cumpleFechaInicio = !filtros.fechaInicio || cliente.fechaInactivacion >= filtros.fechaInicio;
    const cumpleFechaFin = !filtros.fechaFin || cliente.fechaInactivacion <= filtros.fechaFin;

    return cumpleBusqueda && cumpleFechaInicio && cumpleFechaFin;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Historial de Clientes Inactivos</h2>
        </div>
        <button 
          className="btn btn-success"
          onClick={handleExportarExcel}
        >
          <i className="bi bi-file-earmark-excel me-2"></i>
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
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
            <div className="col-md-6">
              <label className="form-label">Buscar</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por RUT, Razón Social o Nombre Fantasía..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes Inactivos */}
      <div className="card">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">Clientes Inactivos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>RUT</th>
                  <th>Razón Social</th>
                  <th>Nombre Fantasía</th>
                  <th>Fecha Inactivación</th>
                  <th>Hora</th>
                  <th>Usuario</th>
                  <th>Motivo</th>
                  <th>Historial</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.rut}</td>
                    <td>{cliente.razonSocial}</td>
                    <td>{cliente.nombreFantasia || '-'}</td>
                    <td>{cliente.fechaInactivacion}</td>
                    <td>{cliente.horaInactivacion}</td>
                    <td>{cliente.usuario}</td>
                    <td>{cliente.motivo}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-info"
                        data-bs-toggle="tooltip"
                        title="Ver historial de estados"
                        onClick={() => {
                          // Aquí iría la lógica para mostrar el historial detallado
                          console.log('Historial de estados:', cliente.historialEstados);
                        }}
                      >
                        <i className="bi bi-clock-history"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No se encontraron clientes inactivos con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialInactivos;