import React from 'react';

function DetalleMovimiento({ movimiento, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Movimiento</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información General</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Fecha:</th>
                      <td>{movimiento.fecha}</td>
                    </tr>
                    <tr>
                      <th>Tipo:</th>
                      <td>
                        <span className={`badge bg-${movimiento.tipo === 'ingreso' ? 'success' : 'danger'}`}>
                          {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>Categoría:</th>
                      <td>{movimiento.categoria}</td>
                    </tr>
                    <tr>
                      <th>Partida:</th>
                      <td>{movimiento.partida}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles del Movimiento</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Cuenta:</th>
                      <td>{movimiento.cuentaBancaria}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{movimiento.sucursal}</td>
                    </tr>
                    <tr>
                      <th>Valor:</th>
                      <td className={`fw-bold ${movimiento.tipo === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                        ${movimiento.valor.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <th>Saldo:</th>
                      <td className="fw-bold">${movimiento.saldo.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {movimiento.descripcion && (
              <div className="mb-4">
                <h6>Descripción</h6>
                <p>{movimiento.descripcion}</p>
              </div>
            )}

            {movimiento.referencia && (
              <div className="mb-4">
                <h6>Referencia</h6>
                <p>{movimiento.referencia}</p>
              </div>
            )}

            {movimiento.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{movimiento.observaciones}</p>
              </div>
            )}

            <div className="mb-4">
              <h6>Información de Usuario</h6>
              <p><strong>Registrado por:</strong> {movimiento.usuario || 'Sistema'}</p>
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

export default DetalleMovimiento;