import React from 'react';

function DetalleCheque({ cheque, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Cheque</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información General</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>N° Cheque:</th>
                      <td>{cheque.numero}</td>
                    </tr>
                    <tr>
                      <th>Tipo:</th>
                      <td>{cheque.tipo.charAt(0).toUpperCase() + cheque.tipo.slice(1)}</td>
                    </tr>
                    <tr>
                      <th>Banco:</th>
                      <td>{cheque.banco}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${
                          cheque.estado === 'pendiente' ? 'warning' :
                          cheque.estado === 'cobrado' ? 'success' :
                          cheque.estado === 'protestado' ? 'danger' :
                          'secondary'
                        }`}>
                          {cheque.estado.charAt(0).toUpperCase() + cheque.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Fechas y Montos</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Fecha Emisión:</th>
                      <td>{cheque.fechaEmision}</td>
                    </tr>
                    <tr>
                      <th>Fecha Cobro:</th>
                      <td>{cheque.fechaCobro}</td>
                    </tr>
                    <tr>
                      <th>Monto:</th>
                      <td className="fw-bold">${cheque.monto.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Historial de Estados</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Usuario</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{cheque.fechaEmision}</td>
                      <td>Emitido</td>
                      <td>Juan Pérez</td>
                      <td>Emisión inicial</td>
                    </tr>
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

export default DetalleCheque;