import React from 'react';

function DetalleVenta({ venta, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle de Venta</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información General</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>N° Factura:</th>
                      <td>{venta.id}</td>
                    </tr>
                    <tr>
                      <th>Fecha:</th>
                      <td>{venta.fecha}</td>
                    </tr>
                    <tr>
                      <th>Cliente:</th>
                      <td>{venta.cliente}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${venta.estado === 'pagada' ? 'success' : 'warning'}`}>
                          {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
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
                      <td>${venta.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>IVA (19%):</th>
                      <td>${venta.iva.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Total:</th>
                      <td className="fw-bold">${venta.total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h6>Detalle de Ítems</h6>
            <div className="table-responsive">
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
                  <tr>
                    <td>Producto A</td>
                    <td>2</td>
                    <td>$500,000</td>
                    <td>$1,000,000</td>
                  </tr>
                  <tr>
                    <td>Servicio B</td>
                    <td>1</td>
                    <td>$260,504</td>
                    <td>$260,504</td>
                  </tr>
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

export default DetalleVenta;