import React from 'react';

function HistorialPagosServicio({ servicio, onClose }) {
  // Datos de ejemplo para el historial
  const historialPagos = [
    {
      fecha: '2023-12-01',
      monto: 150000,
      metodoPago: 'Transferencia',
      comprobante: 'TR-001',
      usuario: 'Juan Pérez'
    },
    {
      fecha: '2023-11-01',
      monto: 145000,
      metodoPago: 'Efectivo',
      comprobante: 'EF-002',
      usuario: 'María González'
    }
  ];

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Historial de Pagos - {servicio.servicio}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info mb-4">
              <strong>Servicio:</strong> {servicio.servicio}<br />
              <strong>Proveedor:</strong> {servicio.proveedor}<br />
              <strong>Día de Pago:</strong> {servicio.diaPago}<br />
              <strong>Monto Estimado:</strong> ${servicio.montoEstimado.toLocaleString()}
            </div>

            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Método de Pago</th>
                    <th>Comprobante</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPagos.map((pago, index) => (
                    <tr key={index}>
                      <td>{pago.fecha}</td>
                      <td>${pago.monto.toLocaleString()}</td>
                      <td>{pago.metodoPago}</td>
                      <td>{pago.comprobante}</td>
                      <td>{pago.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary">
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialPagosServicio;