import React from 'react';

function DetalleEmpleado({ empleado, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Empleado</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información Personal</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>RUT:</th>
                      <td>{empleado.rut}</td>
                    </tr>
                    <tr>
                      <th>Nombre:</th>
                      <td>{empleado.nombre}</td>
                    </tr>
                    <tr>
                      <th>Fecha Nacimiento:</th>
                      <td>{empleado.fechaNacimiento}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{empleado.telefono}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{empleado.email}</td>
                    </tr>
                    <tr>
                      <th>Dirección:</th>
                      <td>{empleado.direccion}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información Laboral</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Cargo:</th>
                      <td>{empleado.cargo}</td>
                    </tr>
                    <tr>
                      <th>Departamento:</th>
                      <td>{empleado.departamento}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{empleado.sucursal}</td>
                    </tr>
                    <tr>
                      <th>Fecha Ingreso:</th>
                      <td>{empleado.fechaIngreso}</td>
                    </tr>
                    <tr>
                      <th>Tipo Contrato:</th>
                      <td>{empleado.tipoContrato}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${
                          empleado.estado === 'activo' ? 'success' :
                          empleado.estado === 'inactivo' ? 'danger' :
                          empleado.estado === 'vacaciones' ? 'info' :
                          empleado.estado === 'licencia' ? 'warning' :
                          'secondary'
                        }`}>
                          {empleado.estado.charAt(0).toUpperCase() + empleado.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información Previsional</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>AFP:</th>
                      <td>{empleado.afp}</td>
                    </tr>
                    <tr>
                      <th>Previsión de Salud:</th>
                      <td>{empleado.prevision}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información Salarial</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Sueldo Base:</th>
                      <td>${empleado.sueldoBase?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {empleado.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{empleado.observaciones}</p>
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

export default DetalleEmpleado;