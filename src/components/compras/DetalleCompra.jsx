import React from 'react';

function DetalleCompra({ compra, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle de Compra</h5>
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
                      <td>{compra.numeroInterno}</td>
                    </tr>
                    <tr>
                      <th>Fecha:</th>
                      <td>{compra.fecha}</td>
                    </tr>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{compra.sucursal}</td>
                    </tr>
                    <tr>
                      <th>Proveedor:</th>
                      <td>{compra.proveedor}</td>
                    </tr>
                    <tr>
                      <th>RUT:</th>
                      <td>{compra.rut}</td>
                    </tr>
                    <tr>
                      <th>Tipo Documento:</th>
                      <td>{compra.tipoDocumento}</td>
                    </tr>
                    <tr>
                      <th>N° Documento:</th>
                      <td>{compra.numeroDocumento}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${compra.estado === 'pagada' ? 'success' : 'warning'}`}>
                          {compra.estado.charAt(0).toUpperCase() + compra.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Resumen</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Subtotal:</th>
                      <td>${compra.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>IVA (19%):</th>
                      <td>${compra.iva.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Total:</th>
                      <td className="fw-bold">${compra.total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h6>Detalle de Ítems</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.descripcion}</td>
                      <td>{item.cantidad}</td>
                      <td>${item.precioUnitario.toLocaleString()}</td>
                      <td>${(item.cantidad * item.precioUnitario).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  {compra.historial.map((registro, index) => (
                    <tr key={index}>
                      <td>{registro.fecha}</td>
                      <td>{registro.usuario}</td>
                      <td>{registro.accion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {compra.observaciones && (
              <div className="mt-4">
                <h6>Observaciones</h6>
                <p>{compra.observaciones}</p>
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

export default DetalleCompra;