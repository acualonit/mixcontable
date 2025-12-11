import React from 'react';

function DetalleProveedor({ proveedor, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Proveedor</h5>
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
                      <td>{proveedor.rut}</td>
                    </tr>
                    <tr>
                      <th>Razón Social:</th>
                      <td>{proveedor.razonSocial}</td>
                    </tr>
                    <tr>
                      <th>Nombre Fantasía:</th>
                      <td>{proveedor.nombreFantasia || '-'}</td>
                    </tr>
                    <tr>
                      <th>Giro:</th>
                      <td>{proveedor.giro || '-'}</td>
                    </tr>
                    <tr>
                      <th>Dirección:</th>
                      <td>{proveedor.direccion}</td>
                    </tr>
                    <tr>
                      <th>Comuna:</th>
                      <td>{proveedor.comuna}</td>
                    </tr>
                    <tr>
                      <th>Ciudad:</th>
                      <td>{proveedor.ciudad}</td>
                    </tr>
                    <tr>
                      <th>Página Web:</th>
                      <td>{proveedor.paginaWeb || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información Comercial</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Método de Pago:</th>
                      <td>{proveedor.metodoPago ? (proveedor.metodoPago.charAt(0).toUpperCase() + proveedor.metodoPago.slice(1)) : (proveedor.condicionPago ? proveedor.condicionPago : '-')}</td>
                    </tr>
                    <tr>
                      <th>Límite de Crédito:</th>
                      <td>{proveedor.limiteCredito ? `$${proveedor.limiteCredito.toLocaleString()}` : '-'}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${proveedor.estado === 'activo' ? 'success' : 'danger'}`}>
                          {proveedor.estado.charAt(0).toUpperCase() + proveedor.estado.slice(1)}
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
                      <td>{proveedor.contactoPrincipal || '-'}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{proveedor.telefonoPrincipal || '-'}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{proveedor.emailPrincipal || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Contacto de Pagos</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Nombre:</th>
                      <td>{proveedor.nombre_vendedor || '-'}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{proveedor.celular_vendedor || proveedor.telefono || '-'}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{proveedor.correo_vendedor || proveedor.correo || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de Pagos */}
            <div className="mb-4">
              <h6>Historial de Pagos</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Medio de Pago</th>
                      <th>N° Documento</th>
                      <th>Valor</th>
                      <th>Detalle</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedor.historialPagos?.map((pago, index) => (
                      <tr key={index}>
                        <td>{pago.fecha}</td>
                        <td>{pago.medioPago}</td>
                        <td>{pago.numeroDocumento}</td>
                        <td>${pago.valor.toLocaleString()}</td>
                        <td>{pago.detalle}</td>
                        <td>{pago.usuario}</td>
                      </tr>
                    ))}
                    {(!proveedor.historialPagos || proveedor.historialPagos.length === 0) && (
                      <tr>
                        <td colSpan="6" className="text-center">No hay pagos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de Compras */}
            <div className="mb-4">
              <h6>Historial de Compras</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>N° Documento</th>
                      <th>Tipo Documento</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedor.historialCompras?.map((compra, index) => (
                      <tr key={index}>
                        <td>{compra.fecha}</td>
                        <td>{compra.numeroDocumento}</td>
                        <td>{compra.tipoDocumento}</td>
                        <td>${compra.total.toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${
                            compra.estado === 'pagada' ? 'success' :
                            compra.estado === 'pendiente' ? 'warning' :
                            'danger'
                          }`}>
                            {compra.estado.charAt(0).toUpperCase() + compra.estado.slice(1)}
                          </span>
                        </td>
                        <td>{compra.usuario}</td>
                      </tr>
                    ))}
                    {(!proveedor.historialCompras || proveedor.historialCompras.length === 0) && (
                      <tr>
                        <td colSpan="6" className="text-center">No hay compras registradas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
                    {proveedor.historialModificaciones?.map((modificacion, index) => (
                      <tr key={index}>
                        <td>{modificacion.fecha}</td>
                        <td>{modificacion.usuario}</td>
                        <td>{modificacion.accion}</td>
                        <td>{modificacion.detalles}</td>
                      </tr>
                    ))}
                    {(!proveedor.historialModificaciones || proveedor.historialModificaciones.length === 0) && (
                      <tr>
                        <td colSpan="4" className="text-center">No hay modificaciones registradas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {(proveedor.observacion || proveedor.comentario) && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{proveedor.observacion || proveedor.comentario}</p>
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

export default DetalleProveedor;