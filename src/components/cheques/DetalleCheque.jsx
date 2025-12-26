import React from 'react';

function DetalleCheque({ cheque = {}, onClose }) {
  const numero = cheque.numero ?? cheque.numero_cheque ?? '';
  const tipo = cheque.tipo ?? (cheque.estado === 'EMITIDO' ? 'emitido' : 'emitido');
  const banco = cheque.banco ?? cheque.cuenta_banco ?? '';
  const cuentaNumero = cheque.cuenta_numero ?? cheque.numero_cuenta ?? '';
  const estadoRaw = cheque.estado ?? '';
  const estado = String(estadoRaw).toLowerCase();
  const fechaEm = cheque.fechaEmision ?? cheque.fecha_emision ?? '';
  const fechaCob = cheque.fechaCobro ?? cheque.fecha_cobro ?? cheque.fecha_cobro ?? '';
  const montoVal = cheque.monto != null ? Number(cheque.monto) : 0;

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
                      <td>{numero}</td>
                    </tr>
                    <tr>
                      <th>Tipo:</th>
                      <td>{typeof tipo === 'string' ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : tipo}</td>
                    </tr>
                    <tr>
                      <th>Banco:</th>
                      <td>{banco ? `${banco}${cuentaNumero ? ' - ' + cuentaNumero : ''}` : ''}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${
                          estado === 'pendiente' ? 'warning' :
                          estado === 'cobrado' || estado === 'COBRADO' ? 'success' :
                          estado === 'anulado' || estado === 'ANULADO' ? 'danger' :
                          estado === 'prestado' ? 'info' :
                          'secondary'
                        }`}>
                          {String(estadoRaw).charAt(0).toUpperCase() + String(estadoRaw).slice(1)}
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
                      <td>{fechaEm}</td>
                    </tr>
                    <tr>
                      <th>Fecha Cobro:</th>
                      <td>{fechaCob}</td>
                    </tr>
                    <tr>
                      <th>Monto:</th>
                      <td className="fw-bold">${montoVal.toLocaleString()}</td>
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
                      <td>{fechaEm}</td>
                      <td>{estadoRaw ?? 'Emitido'}</td>
                      <td>{cheque.usuario ?? 'Juan Pérez'}</td>
                      <td>{cheque.observaciones ?? cheque.observacion ?? ''}</td>
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