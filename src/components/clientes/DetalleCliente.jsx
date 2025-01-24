import React from 'react';

function DetalleCliente({ cliente, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Cliente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información General</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>RUT:</th>
                      <td>{cliente.rut}</td>
                    </tr>
                    <tr>
                      <th>Razón Social:</th>
                      <td>{cliente.razonSocial}</td>
                    </tr>
                    <tr>
                      <th>Nombre Fantasía:</th>
                      <td>{cliente.nombreFantasia || '-'}</td>
                    </tr>
                    <tr>
                      <th>Giro:</th>
                      <td>{cliente.giro}</td>
                    </tr>
                    <tr>
                      <th>Dirección:</th>
                      <td>{cliente.direccion}</td>
                    </tr>
                    <tr>
                      <th>Comuna:</th>
                      <td>{cliente.comuna}</td>
                    </tr>
                    <tr>
                      <th>Ciudad:</th>
                      <td>{cliente.ciudad}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información Comercial</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Condición de Venta:</th>
                      <td>{cliente.condicionVenta === '0' ? 'Contado' : `${cliente.condicionVenta} días`}</td>
                    </tr>
                    <tr>
                      <th>Límite de Crédito:</th>
                      <td>${cliente.limiteCredito?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${cliente.estado === 'activo' ? 'success' : 'danger'}`}>
                          {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Contacto Principal</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Nombre:</th>
                      <td>{cliente.contactoPrincipal}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{cliente.telefonoPrincipal}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{cliente.emailPrincipal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Contacto Cobranza</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Nombre:</th>
                      <td>{cliente.contactoCobranza || '-'}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{cliente.telefonoCobranza || '-'}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{cliente.emailCobranza || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Historial de Ventas</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Documento</th>
                      <th>N° Documento</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cliente.historialVentas?.map((venta, index) => (
                      <tr key={index}>
                        <td>{venta.fecha}</td>
                        <td>{venta.tipoDocumento}</td>
                        <td>{venta.numeroDocumento}</td>
                        <td>${venta.total.toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${venta.estado === 'pagada' ? 'success' : 'warning'}`}>
                            {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!cliente.historialVentas || cliente.historialVentas.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center">No hay ventas registradas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {cliente.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{cliente.observaciones}</p>
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

export default DetalleCliente;