import React from 'react';

function DetalleOtroEgreso({ egreso, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Detalle del Egreso</h5>
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
                      <td>{egreso.fecha}</td>
                    </tr>
                    <tr>
                      <th>Categoría:</th>
                      <td>{egreso.categoria}</td>
                    </tr>
                    <tr>
                      <th>Descripción:</th>
                      <td>{egreso.descripcion}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{egreso.sucursal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información de Pago</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Monto:</th>
                      <td className="text-danger fw-bold">${egreso.monto.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Método de Pago:</th>
                      <td>{egreso.metodoPago}</td>
                    </tr>
                    <tr>
                      <th>Comprobante:</th>
                      <td>{egreso.comprobante || '-'}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${egreso.estado === 'pagado' ? 'success' : 'warning'}`}>
                          {egreso.estado.charAt(0).toUpperCase() + egreso.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {egreso.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{egreso.observaciones}</p>
              </div>
            )}

            {/* Historial de Modificaciones */}
            <div className="mb-4">
              <h6>Historial de Modificaciones</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Acción</th>
                      <th>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {egreso.historial?.map((registro, index) => (
                      <tr key={index}>
                        <td>{registro.fecha}</td>
                        <td>{registro.usuario}</td>
                        <td>{registro.accion}</td>
                        <td>{registro.detalles}</td>
                      </tr>
                    ))}
                    {(!egreso.historial || egreso.historial.length === 0) && (
                      <tr>
                        <td colSpan="4" className="text-center">No hay modificaciones registradas</td>
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

export default DetalleOtroEgreso;