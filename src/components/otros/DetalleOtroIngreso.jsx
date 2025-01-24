import React from 'react';

function DetalleOtroIngreso({ ingreso, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Detalle del Ingreso</h5>
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
                      <td>{ingreso.fecha}</td>
                    </tr>
                    <tr>
                      <th>Categoría:</th>
                      <td>{ingreso.categoria}</td>
                    </tr>
                    <tr>
                      <th>Descripción:</th>
                      <td>{ingreso.descripcion}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{ingreso.sucursal}</td>
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
                      <td className="text-success fw-bold">${ingreso.monto.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Método de Pago:</th>
                      <td>{ingreso.metodoPago}</td>
                    </tr>
                    <tr>
                      <th>Comprobante:</th>
                      <td>{ingreso.comprobante || '-'}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${ingreso.estado === 'recibido' ? 'success' : 'warning'}`}>
                          {ingreso.estado.charAt(0).toUpperCase() + ingreso.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {ingreso.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{ingreso.observaciones}</p>
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
                    {ingreso.historial?.map((registro, index) => (
                      <tr key={index}>
                        <td>{registro.fecha}</td>
                        <td>{registro.usuario}</td>
                        <td>{registro.accion}</td>
                        <td>{registro.detalles}</td>
                      </tr>
                    ))}
                    {(!ingreso.historial || ingreso.historial.length === 0) && (
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

export default DetalleOtroIngreso;