import React from 'react';

function DetalleGasto({ gasto, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Detalle del Gasto</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información General</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>N° Interno:</th>
                      <td>{gasto.numeroInterno}</td>
                    </tr>
                    <tr>
                      <th>Fecha:</th>
                      <td>{gasto.fecha}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{gasto.sucursal}</td>
                    </tr>
                    <tr>
                      <th>Categoría:</th>
                      <td>{gasto.categoria}</td>
                    </tr>
                    <tr>
                      <th>Descripción:</th>
                      <td>{gasto.descripcion}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles del Documento</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Tipo Documento:</th>
                      <td>{gasto.tipoDocumento}</td>
                    </tr>
                    <tr>
                      <th>N° Documento:</th>
                      <td>{gasto.numeroDocumento}</td>
                    </tr>
                    <tr>
                      <th>Monto:</th>
                      <td className="fw-bold">${gasto.monto.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${gasto.estado === 'pagado' ? 'success' : 'warning'}`}>
                          {gasto.estado.charAt(0).toUpperCase() + gasto.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h6>Historial de Cambios</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {gasto.historial.map((registro, index) => (
                    <tr key={index}>
                      <td>{registro.fecha}</td>
                      <td>{registro.usuario}</td>
                      <td>{registro.accion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default DetalleGasto;