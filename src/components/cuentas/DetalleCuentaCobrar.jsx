import React from 'react';

function DetalleCuentaCobrar({ cuenta, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Detalle de Cuenta por Cobrar</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información del Cliente</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Cliente:</th>
                      <td>{cuenta.cliente}</td>
                    </tr>
                    <tr>
                      <th>RUT:</th>
                      <td>{cuenta.rut}</td>
                    </tr>
                    <tr>
                      <th>Contacto:</th>
                      <td>{cuenta.contacto}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{cuenta.telefono}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles de la Deuda</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>N° Documento:</th>
                      <td>{cuenta.numeroDocumento}</td>
                    </tr>
                    <tr>
                      <th>Tipo Documento:</th>
                      <td>{cuenta.tipoDocumento}</td>
                    </tr>
                    <tr>
                      <th>Fecha Emisión:</th>
                      <td>{cuenta.fechaEmision}</td>
                    </tr>
                    <tr>
                      <th>Fecha Vencimiento:</th>
                      <td>{cuenta.fechaVencimiento}</td>
                    </tr>
                    <tr>
                      <th>Monto Total:</th>
                      <td className="fw-bold">${cuenta.montoTotal?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Monto Pagado:</th>
                      <td className="text-success">${cuenta.montoPagado?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Saldo Pendiente:</th>
                      <td className="text-danger">${(cuenta.montoTotal - cuenta.montoPagado)?.toLocaleString()}</td>
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
                    {cuenta.historialPagos?.map((pago, index) => (
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

            <div className="mb-4">
              <h6>Observaciones</h6>
              <p>{cuenta.observaciones || 'Sin observaciones'}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-success">
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleCuentaCobrar;