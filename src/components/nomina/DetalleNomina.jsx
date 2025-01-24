import React from 'react';

function DetalleNomina({ nomina, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle de Nómina</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información del Empleado</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Empleado:</th>
                      <td>{nomina.empleado}</td>
                    </tr>
                    <tr>
                      <th>Cargo:</th>
                      <td>{nomina.cargo}</td>
                    </tr>
                    <tr>
                      <th>Período:</th>
                      <td>{nomina.periodo}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información de Pago</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Sueldo Base:</th>
                      <td>${nomina.sueldoBase.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Bonificaciones:</th>
                      <td className="text-success">+${nomina.bonificaciones.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Descuentos:</th>
                      <td className="text-danger">-${nomina.descuentos.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Total a Pagar:</th>
                      <td className="fw-bold">${nomina.totalPago.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {nomina.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{nomina.observaciones}</p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary">
              <i className="bi bi-printer me-2"></i>
              Imprimir Liquidación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleNomina;