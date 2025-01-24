import React from 'react';

function DetalleCuentaPagar({ cuenta, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Detalle de Cuenta por Pagar</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información del Proveedor</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Proveedor:</th>
                      <td>{cuenta.proveedor}</td>
                    </tr>
                    <tr>
                      <th>RUT:</th>
                      <td>{cuenta.rut}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles de la Deuda</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Origen:</th>
                      <td>{cuenta.origen}</td>
                    </tr>
                    <tr>
                      <th>Documento:</th>
                      <td>{cuenta.documento}</td>
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
                      <th>Días Mora:</th>
                      <td className={cuenta.diasMora > 0 ? 'text-danger' : ''}>
                        {cuenta.diasMora > 0 ? `${cuenta.diasMora} días` : '-'}
                      </td>
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
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${
                          cuenta.diasMora > 0 ? 'danger' : 
                          cuenta.montoPagado === cuenta.montoTotal ? 'success' : 
                          'warning'
                        }`}>
                          {cuenta.diasMora > 0 ? 'Vencida' : 
                           cuenta.montoPagado === cuenta.montoTotal ? 'Pagada' : 
                           'Pendiente'}
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
                    {cuenta.historialPagos?.map((pago, index) => (
                      <tr key={index}>
                        <td>{pago.fecha}</td>
                        <td>${pago.monto.toLocaleString()}</td>
                        <td>{pago.metodoPago}</td>
                        <td>{pago.comprobante}</td>
                        <td>{pago.usuario}</td>
                      </tr>
                    ))}
                    {(!cuenta.historialPagos || cuenta.historialPagos.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center">No hay pagos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {cuenta.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{cuenta.observaciones}</p>
              </div>
            )}
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

export default DetalleCuentaPagar;