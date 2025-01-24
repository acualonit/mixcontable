import React, { useState } from 'react';
import { exportToExcel } from '../../utils/exportUtils';

function HistorialPagos({ onBack }) {
  const [filtros, setFiltros] = useState({
    periodo: '',
    estado: '',
    sucursal: ''
  });

  // Datos de ejemplo
  const [pagos] = useState([
    {
      id: 1,
      periodo: '2024-01',
      estadoPago: 'Pagado',
      nombre: 'Juan Pérez',
      documento: '12.345.678-9',
      tipoDocumento: 'RUT',
      cargo: 'Vendedor',
      sucursal: 'Central',
      totalPagar: 800000,
      valorPagado: 800000,
      metodoPago: 'Transferencia',
      preferencia: 'Liquidación de Sueldo',
      fechaPago: '2024-01-30'
    }
  ]);

  const handleExportarExcel = () => {
    const dataToExport = pagos.map(pago => ({
      'Periodo': pago.periodo,
      'Estado': pago.estadoPago,
      'Nombre': pago.nombre,
      'Documento': pago.documento,
      'Tipo Documento': pago.tipoDocumento,
      'Cargo': pago.cargo,
      'Sucursal': pago.sucursal,
      'Total a Pagar': pago.totalPagar,
      'Valor Pagado': pago.valorPagado,
      'Método de Pago': pago.metodoPago,
      'Preferencia': pago.preferencia,
      'Fecha de Pago': pago.fechaPago
    }));

    exportToExcel(dataToExport, 'Historial_Pagos_Nomina');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Historial de Personal Pagado</h2>
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
            <div className="col-md-4">
              <label className="form-label">Periodo</label>
              <input
                type="month"
                className="form-control"
                value={filtros.periodo}
                onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="Pagado">Pagado</option>
                <option value="Por Pagar">Por Pagar</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Sucursal</label>
              <select
                className="form-select"
                value={filtros.sucursal}
                onChange={(e) => setFiltros({...filtros, sucursal: e.target.value})}
              >
                <option value="">Todas</option>
                <option value="Central">Central</option>
                <option value="Norte">Norte</option>
                <option value="Sur">Sur</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Historial de Pagos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Periodo</th>
                  <th>Estado</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Cargo</th>
                  <th>Sucursal</th>
                  <th>Total a Pagar</th>
                  <th>Valor Pagado</th>
                  <th>Método de Pago</th>
                  <th>Preferencia</th>
                  <th>Fecha de Pago</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.periodo}</td>
                    <td>
                      <span className={`badge bg-${pago.estadoPago === 'Pagado' ? 'success' : 'warning'}`}>
                        {pago.estadoPago}
                      </span>
                    </td>
                    <td>{pago.nombre}</td>
                    <td>
                      <span className="d-block">{pago.documento}</span>
                      <small className="text-muted">{pago.tipoDocumento}</small>
                    </td>
                    <td>{pago.cargo}</td>
                    <td>{pago.sucursal}</td>
                    <td>${pago.totalPagar.toLocaleString()}</td>
                    <td>${pago.valorPagado.toLocaleString()}</td>
                    <td>{pago.metodoPago || '-'}</td>
                    <td>{pago.preferencia}</td>
                    <td>{pago.fechaPago || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialPagos;