import React, { useState } from 'react';

function DetalleHistorialEgreso({ egreso, onClose }) {
  const [showEstadoForm, setShowEstadoForm] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(egreso.estadoPago || 'pendiente');
  const [observaciones, setObservaciones] = useState('');

  const handleCambiarEstado = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el cambio de estado
    const cambioEstado = {
      estadoAnterior: egreso.estadoPago,
      nuevoEstado: nuevoEstado,
      observaciones: observaciones,
      usuario: 'Usuario Actual', // Esto debería venir del contexto de autenticación
      fecha: new Date().toISOString()
    };
    console.log('Cambio de estado:', cambioEstado);
    setShowEstadoForm(false);
  };

  const renderDetalleSegunCategoria = () => {
    switch (egreso.categoria) {
      case 'compra_activos':
        return (
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">Detalle de Compra de Activos</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre detallado de la cuenta:</strong> {egreso.nombreCuenta}</p>
                  <p><strong>Fecha de Compra:</strong> {egreso.fechaCompra}</p>
                  <p><strong>Unidad de Cobro Mensual:</strong> {egreso.unidadCobro}</p>
                  <p><strong>Valor del Activo:</strong> ${egreso.valorActivo?.toLocaleString()}</p>
                  <p><strong>Valor Cuota Mensual:</strong> ${egreso.valorCuotaMensual?.toLocaleString()}</p>
                  <p><strong>Cantidad de Cuotas:</strong> {egreso.cantidadCuotas}</p>
                  <p><strong>Días de Pago:</strong> {egreso.diasPago}</p>
                  <p><strong>Nombre del Activo:</strong> {egreso.nombreActivo}</p>
                  <p><strong>Clasificación:</strong> {egreso.clasificacion}</p>
                  <p><strong>Modelo del Activo:</strong> {egreso.modeloActivo}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Marca del Activo:</strong> {egreso.marcaActivo}</p>
                  <p><strong>Referencia del Activo:</strong> {egreso.referenciaActivo}</p>
                  <p><strong>Fecha de Inicio de Pago:</strong> {egreso.fechaInicioPago}</p>
                  <p><strong>Proveedor Financiador:</strong> {egreso.proveedorFinanciador}</p>
                  <p><strong>Tipo de Documento:</strong> {egreso.tipoDocumento}</p>
                  <p><strong>Total Pagado:</strong> ${egreso.totalPagado?.toLocaleString()}</p>
                  <p><strong>Restante Deuda:</strong> ${egreso.restanteDeuda?.toLocaleString()}</p>
                  <p><strong>Cuotas Pagadas:</strong> {egreso.cuotasPagadas}</p>
                  <p><strong>Cuotas Restantes:</strong> {egreso.cuotasRestantes}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'arriendo':
        return (
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">Detalle de Arriendo de Local</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre detallado de la cuenta:</strong> {egreso.nombreCuenta}</p>
                  <p><strong>Fecha de Inicio del Arriendo:</strong> {egreso.fechaInicioArriendo}</p>
                  <p><strong>Unidad de Cobro Mensual:</strong> {egreso.unidadCobro}</p>
                  <p><strong>Valor Cuota Mensual:</strong> ${egreso.valorCuotaMensual?.toLocaleString()}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Dirección de la Propiedad:</strong> {egreso.direccionPropiedad}</p>
                  <p><strong>Días de Pago:</strong> {egreso.diasPago}</p>
                  <p><strong>Tipo de Documento:</strong> {egreso.tipoDocumento}</p>
                  <p><strong>Total Pagado Acumulado:</strong> ${egreso.totalPagadoAcumulado?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'deuda_bancos':
        return (
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">Detalle de Deuda con Bancos</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre detallado de la cuenta:</strong> {egreso.nombreCuenta}</p>
                  <p><strong>Fecha de Obligación Financiera:</strong> {egreso.fechaObligacion}</p>
                  <p><strong>Valor Deuda:</strong> ${egreso.valorDeuda?.toLocaleString()}</p>
                  <p><strong>Unidad de Cobro Mensual:</strong> {egreso.unidadCobro}</p>
                  <p><strong>Valor Cuota Mensual:</strong> ${egreso.valorCuotaMensual?.toLocaleString()}</p>
                  <p><strong>Cantidad de Cuotas:</strong> {egreso.cantidadCuotas}</p>
                  <p><strong>Días de Pago:</strong> {egreso.diasPago}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Clasificación:</strong> {egreso.clasificacion}</p>
                  <p><strong>Descripción de la Deuda:</strong> {egreso.descripcionDeuda}</p>
                  <p><strong>Total Pagado:</strong> ${egreso.totalPagado?.toLocaleString()}</p>
                  <p><strong>Restante Deuda:</strong> ${egreso.restanteDeuda?.toLocaleString()}</p>
                  <p><strong>Cuotas Pagadas:</strong> {egreso.cuotasPagadas}</p>
                  <p><strong>Cuotas Restantes:</strong> {egreso.cuotasRestantes}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'leasing':
        return (
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">Detalle de Leasing</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre detallado de la cuenta:</strong> {egreso.nombreCuenta}</p>
                  <p><strong>Fecha de Leasing:</strong> {egreso.fechaLeasing}</p>
                  <p><strong>Unidad de Cobro Mensual:</strong> {egreso.unidadCobro}</p>
                  <p><strong>Valor del Leasing:</strong> ${egreso.valorLeasing?.toLocaleString()}</p>
                  <p><strong>Valor Cuota Mensual:</strong> ${egreso.valorCuotaMensual?.toLocaleString()}</p>
                  <p><strong>Cantidad de Cuotas:</strong> {egreso.cantidadCuotas}</p>
                  <p><strong>Días de Pago:</strong> {egreso.diasPago}</p>
                  <p><strong>Nombre de Activo:</strong> {egreso.nombreActivo}</p>
                  <p><strong>Modelo del Activo:</strong> {egreso.modeloActivo}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Marca del Activo:</strong> {egreso.marcaActivo}</p>
                  <p><strong>Referencia del Activo:</strong> {egreso.referenciaActivo}</p>
                  <p><strong>Fecha de Inicio de Pago:</strong> {egreso.fechaInicioPago}</p>
                  <p><strong>Proveedor Financiador:</strong> {egreso.proveedorFinanciador}</p>
                  <p><strong>Tipo de Documento:</strong> {egreso.tipoDocumento}</p>
                  <p><strong>Total Pagado:</strong> ${egreso.totalPagado?.toLocaleString()}</p>
                  <p><strong>Restante Deuda:</strong> ${egreso.restanteDeuda?.toLocaleString()}</p>
                  <p><strong>Cuotas Pagadas:</strong> {egreso.cuotasPagadas}</p>
                  <p><strong>Cuotas Restantes:</strong> {egreso.cuotasRestantes}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'otros':
        return (
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">Detalle de Otros Pagos</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre detallado de la cuenta:</strong> {egreso.nombreCuenta}</p>
                  <p><strong>Fecha de Obligación Financiera:</strong> {egreso.fechaObligacion}</p>
                  <p><strong>Valor Deuda:</strong> ${egreso.valorDeuda?.toLocaleString()}</p>
                  <p><strong>Unidad de Cobro Mensual:</strong> {egreso.unidadCobro}</p>
                  <p><strong>Valor Cuota Mensual:</strong> ${egreso.valorCuotaMensual?.toLocaleString()}</p>
                  <p><strong>Cantidad de Cuotas:</strong> {egreso.cantidadCuotas}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Días de Pago:</strong> {egreso.diasPago}</p>
                  <p><strong>Descripción de la Deuda:</strong> {egreso.descripcionDeuda}</p>
                  <p><strong>Tipo de Documento:</strong> {egreso.tipoDocumento}</p>
                  <p><strong>Total Pagado:</strong> ${egreso.totalPagado?.toLocaleString()}</p>
                  <p><strong>Restante Deuda:</strong> ${egreso.restanteDeuda?.toLocaleString()}</p>
                  <p><strong>Cuotas Pagadas:</strong> {egreso.cuotasPagadas}</p>
                  <p><strong>Cuotas Restantes:</strong> {egreso.cuotasRestantes}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderTablaHistorialPagos = () => {
    return (
      <div className="mb-4">
        <h6>Historial de Pagos Detallados</h6>
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Fecha de Pago</th>
                <th>N° Cuota</th>
                <th>Valor Cuota</th>
                <th>Fecha Pagada</th>
                <th>Valor Pagado</th>
                <th>Tipo Documento</th>
                <th>N° Documento</th>
                {['compra_activos', 'deuda_bancos', 'leasing', 'otros'].includes(egreso.categoria) && (
                  <th>Amortización</th>
                )}
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {egreso.historialPagos?.map((pago, index) => (
                <tr key={index}>
                  <td>{pago.fechaPago}</td>
                  <td>{pago.numeroCuota}</td>
                  <td>${pago.valorCuota?.toLocaleString()}</td>
                  <td>{pago.fechaPagada || '-'}</td>
                  <td>{pago.valorPagado ? `$${pago.valorPagado.toLocaleString()}` : '-'}</td>
                  <td>{pago.tipoDocumento || '-'}</td>
                  <td>{pago.numeroDocumento || '-'}</td>
                  {['compra_activos', 'deuda_bancos', 'leasing', 'otros'].includes(egreso.categoria) && (
                    <td>{pago.amortizacion ? `$${pago.amortizacion.toLocaleString()}` : '-'}</td>
                  )}
                  <td>
                    <span className={`badge bg-${
                      pago.estado === 'pagada' ? 'success' :
                      pago.estado === 'vencida' ? 'danger' :
                      'warning'
                    }`}>
                      {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!egreso.historialPagos || egreso.historialPagos.length === 0) && (
                <tr>
                  <td colSpan={egreso.categoria === 'arriendo' ? 8 : 9} className="text-center">
                    No hay pagos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Egreso Recurrente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Información del Proveedor */}
            <div className="alert alert-info mb-4">
              <div className="row">
                <div className="col-md-6">
                  <strong>Proveedor:</strong> {egreso.proveedor}<br />
                  <strong>RUT:</strong> {egreso.rut}
                </div>
                <div className="col-md-6">
                  <strong>Estado:</strong> {' '}
                  <span className={`badge bg-${
                    egreso.estadoPago === 'pendiente' ? 'warning' :
                    egreso.estadoPago === 'pagada' ? 'success' :
                    'danger'
                  }`}>
                    {egreso.estadoPago?.charAt(0).toUpperCase() + egreso.estadoPago?.slice(1) || 'Pendiente'}
                  </span>
                  <button 
                    className="btn btn-sm btn-warning ms-2"
                    onClick={() => setShowEstadoForm(true)}
                  >
                    Cambiar Estado
                  </button>
                </div>
              </div>
            </div>

            {/* Formulario de Cambio de Estado */}
            {showEstadoForm && (
              <div className="card mb-4">
                <div className="card-header bg-warning">
                  <h6 className="card-title mb-0">Cambiar Estado de Pago</h6>
                </div>
                <div className="card-body">
                  <form onSubmit={handleCambiarEstado}>
                    <div className="mb-3">
                      <label className="form-label">Nuevo Estado</label>
                      <select
                        className="form-select"
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                        required
                      >
                        <option value="pendiente">Pendiente de Pago</option>
                        <option value="pagada">Pagada</option>
                        <option value="descartado">Descartado de Pago</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Observaciones</label>
                      <textarea
                        className="form-control"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows="2"
                        required
                        placeholder="Indique el motivo del cambio de estado"
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Usuario que realiza el cambio</label>
                      <input
                        type="text"
                        className="form-control"
                        value="Usuario Actual"
                        disabled
                      />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowEstadoForm(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-warning">
                        Guardar Cambio
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Detalles según categoría */}
            {renderDetalleSegunCategoria()}

            {/* Tabla de Historial de Pagos */}
            {renderTablaHistorialPagos()}

            {/* Historial de Cambios de Estado */}
            <div className="mb-4">
              <h6>Historial de Cambios de Estado</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Estado Anterior</th>
                      <th>Nuevo Estado</th>
                      <th>Usuario</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {egreso.historialEstados?.map((cambio, index) => (
                      <tr key={index}>
                        <td>{cambio.fecha}</td>
                        <td>{cambio.estadoAnterior}</td>
                        <td>{cambio.nuevoEstado}</td>
                        <td>{cambio.usuario}</td>
                        <td>{cambio.observaciones}</td>
                      </tr>
                    ))}
                    {(!egreso.historialEstados || egreso.historialEstados.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center">No hay cambios de estado registrados</td>
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

export default DetalleHistorialEgreso;