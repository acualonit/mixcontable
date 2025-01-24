import React from 'react';

function DetalleServicio({ servicio, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Servicio</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información del Servicio</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Servicio:</th>
                      <td>{servicio.servicio}</td>
                    </tr>
                    <tr>
                      <th>Proveedor:</th>
                      <td>{servicio.proveedor}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{servicio.sucursal}</td>
                    </tr>
                    <tr>
                      <th>Fecha Vencimiento:</th>
                      <td>{servicio.fechaVencimiento}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información de Pago</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Monto Estimado:</th>
                      <td>${servicio.montoEstimado?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Monto Real:</th>
                      <td>
                        {servicio.montoReal 
                          ? `$${servicio.montoReal.toLocaleString()}`
                          : '-'
                        }
                      </td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${servicio.estado === 'pagado' ? 'success' : 'warning'}`}>
                          {servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Historial de Pagos</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
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
                    {servicio.historialPagos?.map((pago, index) => (
                      <tr key={index}>
                        <td>{pago.fecha}</td>
                        <td>${pago.monto.toLocaleString()}</td>
                        <td>{pago.metodoPago}</td>
                        <td>{pago.comprobante}</td>
                        <td>{pago.usuario}</td>
                      </tr>
                    ))}
                    {(!servicio.historialPagos || servicio.historialPagos.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center">No hay pagos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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

export default DetalleServicio;