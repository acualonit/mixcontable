import React from 'react';
import { exportToExcel } from '../../utils/exportUtils';
import { DOCUMENT_TYPES } from '../../utils/documentTypes';

function DetalleEgresoRecurrente({ egreso, onClose }) {
  const handleExportarExcel = () => {
    // Preparar datos de la tabla de historial
    const historialData = egreso.historialPagos?.map(pago => ({
      'Fecha de Pago': pago.fechaPago,
      'N° Cuota': pago.numeroCuota,
      'Valor Cuota': pago.valorCuota,
      'Fecha Pagada': pago.fechaPagada || '-',
      'Valor Pagado': pago.valorPagado || '-',
      'Tipo Documento': DOCUMENT_TYPES[pago.tipoDocumento]?.label || '-',
      'N° Documento': pago.numeroDocumento || '-',
      'Amortización': pago.amortizacion || '-',
      'Estado': pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)
    })) || [];

    exportToExcel(historialData, `Historial_Pagos_${egreso.detalleCuenta.replace(/\s+/g, '_')}`);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Egreso Recurrente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información General</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Categoría:</th>
                      <td>{egreso.categoria}</td>
                    </tr>
                    <tr>
                      <th>Detalle:</th>
                      <td>{egreso.detalleCuenta}</td>
                    </tr>
                    <tr>
                      <th>Monto Mensual:</th>
                      <td>${egreso.cuotaMes.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Día de Pago:</th>
                      <td>{egreso.diasPago}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Estado y Pagos</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${
                          egreso.estado === 'pendiente' ? 'warning' :
                          egreso.estado === 'vencida' ? 'danger' :
                          'success'
                        }`}>
                          {egreso.estado.charAt(0).toUpperCase() + egreso.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>Total Pagado:</th>
                      <td>${(egreso.totalPagado || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Cuotas Pagadas:</th>
                      <td>{egreso.cuotasPagadas || 0}</td>
                    </tr>
                    <tr>
                      <th>Cuotas Restantes:</th>
                      <td>{egreso.cuotasRestantes || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6>Historial de Pagos</h6>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={handleExportarExcel}
                >
                  <i className="bi bi-file-earmark-excel me-2"></i>
                  Exportar Excel
                </button>
              </div>
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
                      <th>Amortización</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {egreso.historialPagos?.map((pago, index) => (
                      <tr key={index}>
                        <td>{pago.fechaPago}</td>
                        <td>{pago.numeroCuota}</td>
                        <td>${pago.valorCuota.toLocaleString()}</td>
                        <td>{pago.fechaPagada || '-'}</td>
                        <td>{pago.valorPagado ? `$${pago.valorPagado.toLocaleString()}` : '-'}</td>
                        <td>{DOCUMENT_TYPES[pago.tipoDocumento]?.label || '-'}</td>
                        <td>{pago.numeroDocumento || '-'}</td>
                        <td>{pago.amortizacion ? `$${pago.amortizacion.toLocaleString()}` : '-'}</td>
                        <td>
                          <span className={`badge bg-${
                            pago.estado === 'pendiente' ? 'warning' :
                            pago.estado === 'vencida' ? 'danger' :
                            'success'
                          }`}>
                            {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!egreso.historialPagos || egreso.historialPagos.length === 0) && (
                      <tr>
                        <td colSpan="9" className="text-center">No hay pagos registrados</td>
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

export default DetalleEgresoRecurrente;