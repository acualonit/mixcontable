import React from 'react';

function DetalleCuenta({ cuenta, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle de Cuenta</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información de la Cuenta</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Banco:</th>
                      <td>{cuenta?.banco}</td>
                    </tr>
                    <tr>
                      <th>Tipo de Cuenta:</th>
                      <td>{cuenta?.tipoCuenta}</td>
                    </tr>
                    <tr>
                      <th>Número de Cuenta:</th>
                      <td>{cuenta?.numeroCuenta}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{cuenta?.sucursal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Saldos</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Saldo Actual:</th>
                      <td className="fw-bold">${cuenta?.saldoActual?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Última Actualización:</th>
                      <td>{cuenta?.ultimaActualizacion}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Observaciones</h6>
              <p>{cuenta?.observaciones || 'Sin observaciones'}</p>
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

export default DetalleCuenta;