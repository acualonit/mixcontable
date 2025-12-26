import React from 'react';

function DetalleMovimiento({ movimiento, onClose }) {
  if (!movimiento) return null;
  const fecha = movimiento.fecha ?? movimiento.date ?? movimiento.created_at ?? '';
  const tipoRaw = movimiento.tipo ?? movimiento.tipo_movimiento ?? movimiento.movement_type ?? '';
  const tipoLower = String(tipoRaw).toLowerCase();
  const isIngreso = tipoLower.includes('cred') || tipoLower.includes('ingreso');
  const categoria = movimiento.categoria ?? movimiento.descripcion ?? '';
  const cuentaNombre = movimiento.cuenta_banco ? `${movimiento.cuenta_banco} - ${movimiento.cuenta_numero}` : (movimiento.cuentaBancaria ?? movimiento.cuenta_bancaria ?? movimiento.cuenta ?? '');
  const sucursal = movimiento.cuenta_sucursal_nombre ?? movimiento.sucursal ?? '';
  const valor = movimiento.__valor ?? Number(movimiento.monto ?? movimiento.valor ?? movimiento.amount ?? 0);
  const saldo = movimiento.__rowSaldo ?? movimiento.saldo ?? 0;

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
                      <td>{fecha}</td>
                    </tr>
                    <tr>
                      <th>Tipo:</th>
                      <td>
                        <span className={`badge bg-${isIngreso ? 'success' : 'danger'}`}>
                          {String(tipoRaw).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>Categoría:</th>
                      <td>{categoria}</td>
                    </tr>
                    {/* Partida removida */}
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles del Movimiento</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Cuenta:</th>
                      <td>{cuentaNombre}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{sucursal}</td>
                    </tr>
                    <tr>
                      <th>Valor:</th>
                      <td className={`fw-bold ${isIngreso ? 'text-success' : 'text-danger'}`}>
                        ${valor.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <th>Saldo:</th>
                      <td className="fw-bold">${Number(saldo).toLocaleString()}</td>
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