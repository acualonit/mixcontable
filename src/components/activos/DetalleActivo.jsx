import React from 'react';

function DetalleActivo({ activo, onClose }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Activo</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información General</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Código:</th>
                      <td>{activo.codigo}</td>
                    </tr>
                    <tr>
                      <th>Nombre:</th>
                      <td>{activo.nombre}</td>
                    </tr>
                    <tr>
                      <th>Descripción:</th>
                      <td>{activo.descripcion}</td>
                    </tr>
                    <tr>
                      <th>Categoría:</th>
                      <td>{activo.categoria}</td>
                    </tr>
                    <tr>
                      <th>Marca:</th>
                      <td>{activo.marca}</td>
                    </tr>
                    <tr>
                      <th>Modelo:</th>
                      <td>{activo.modelo}</td>
                    </tr>
                    <tr>
                      <th>N° Serie:</th>
                      <td>{activo.serie}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Información Financiera</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Fecha Adquisición:</th>
                      <td>{activo.fechaAdquisicion}</td>
                    </tr>
                    <tr>
                      <th>Valor Compra:</th>
                      <td>${activo.valorCompra.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Vida Útil:</th>
                      <td>{activo.vidaUtil} meses</td>
                    </tr>
                    <tr>
                      <th>Depreciación Mensual:</th>
                      <td>${activo.depreciacionMensual?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Valor Residual:</th>
                      <td>${activo.valorResidual?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>N° Factura:</th>
                      <td>{activo.factura}</td>
                    </tr>
                    <tr>
                      <th>Proveedor:</th>
                      <td>{activo.proveedor}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Ubicación y Responsable</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Sucursal:</th>
                      <td>{activo.sucursal}</td>
                    </tr>
                    <tr>
                      <th>Ubicación:</th>
                      <td>{activo.ubicacion}</td>
                    </tr>
                    <tr>
                      <th>Responsable:</th>
                      <td>{activo.responsable}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${
                          activo.estado === 'activo' ? 'success' :
                          activo.estado === 'en_mantenimiento' ? 'warning' :
                          activo.estado === 'dado_de_baja' ? 'danger' :
                          'secondary'
                        }`}>
                          {activo.estado.charAt(0).toUpperCase() + activo.estado.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de Mantenimientos */}
            <div className="mb-4">
              <h6>Historial de Mantenimientos</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Costo</th>
                      <th>Proveedor</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activo.historialMantenimientos?.map((mantenimiento, index) => (
                      <tr key={index}>
                        <td>{mantenimiento.fecha}</td>
                        <td>{mantenimiento.tipo}</td>
                        <td>{mantenimiento.descripcion}</td>
                        <td>${mantenimiento.costo.toLocaleString()}</td>
                        <td>{mantenimiento.proveedor}</td>
                        <td>{mantenimiento.usuario}</td>
                      </tr>
                    ))}
                    {(!activo.historialMantenimientos || activo.historialMantenimientos.length === 0) && (
                      <tr>
                        <td colSpan="6" className="text-center">No hay mantenimientos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de Movimientos */}
            <div className="mb-4">
              <h6>Historial de Movimientos</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Ubicación Anterior</th>
                      <th>Nueva Ubicación</th>
                      <th>Responsable Anterior</th>
                      <th>Nuevo Responsable</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activo.historialMovimientos?.map((movimiento, index) => (
                      <tr key={index}>
                        <td>{movimiento.fecha}</td>
                        <td>{movimiento.tipo}</td>
                        <td>{movimiento.ubicacionAnterior}</td>
                        <td>{movimiento.nuevaUbicacion}</td>
                        <td>{movimiento.responsableAnterior}</td>
                        <td>{movimiento.nuevoResponsable}</td>
                        <td>{movimiento.usuario}</td>
                      </tr>
                    ))}
                    {(!activo.historialMovimientos || activo.historialMovimientos.length === 0) && (
                      <tr>
                        <td colSpan="7" className="text-center">No hay movimientos registrados</td>
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
                    {activo.historialModificaciones?.map((modificacion, index) => (
                      <tr key={index}>
                        <td>{modificacion.fecha}</td>
                        <td>{modificacion.usuario}</td>
                        <td>{modificacion.accion}</td>
                        <td>{modificacion.detalles}</td>
                      </tr>
                    ))}
                    {(!activo.historialModificaciones || activo.historialModificaciones.length === 0) && (
                      <tr>
                        <td colSpan="4" className="text-center">No hay modificaciones registradas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {activo.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{activo.observaciones}</p>
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

export default DetalleActivo;