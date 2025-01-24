import React from 'react';
import { exportToExcel } from '../../utils/exportUtils';

function HistorialFinancieroEgreso({ egreso, onClose }) {
  const renderTablaSegunCategoria = () => {
    const columnas = [
      { key: 'fechaPago', label: 'Fecha de Pago' },
      { key: 'numeroCuota', label: 'N° Cuota' },
      { key: 'valorCuota', label: 'Valor Cuota' },
      { key: 'fechaPagada', label: 'Fecha Pagada' },
      { key: 'valorPagado', label: 'Valor Pagado' },
      { key: 'tipoDocumento', label: 'Tipo Documento' },
      { key: 'numeroDocumento', label: 'N° Documento' }
    ];

    // Agregar columna de amortización para categorías específicas
    if (['compra_activos', 'deuda_bancos', 'leasing', 'otros'].includes(egreso.categoria)) {
      columnas.push({ key: 'amortizacion', label: 'Amortización' });
    }

    columnas.push({ key: 'estado', label: 'Estado' });

    return (
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              {columnas.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {egreso.cuotasProyectadas?.map((cuota, index) => (
              <tr key={index}>
                <td>{cuota.fechaPago}</td>
                <td>{cuota.numeroCuota}</td>
                <td>${cuota.valorCuota?.toLocaleString()}</td>
                <td>{cuota.fechaPagada || '-'}</td>
                <td>{cuota.valorPagado ? `$${cuota.valorPagado.toLocaleString()}` : '-'}</td>
                <td>{cuota.tipoDocumento || '-'}</td>
                <td>{cuota.numeroDocumento || '-'}</td>
                {['compra_activos', 'deuda_bancos', 'leasing', 'otros'].includes(egreso.categoria) && (
                  <td>{cuota.amortizacion ? `$${cuota.amortizacion.toLocaleString()}` : '-'}</td>
                )}
                <td>
                  <span className={`badge bg-${
                    cuota.estado === 'pagada' ? 'success' :
                    cuota.estado === 'vencida' ? 'danger' :
                    'warning'
                  }`}>
                    {cuota.estado.charAt(0).toUpperCase() + cuota.estado.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleExportarExcel = () => {
    const columnas = [
      'Fecha de Pago',
      'N° Cuota',
      'Valor Cuota',
      'Fecha Pagada',
      'Valor Pagado',
      'Tipo Documento',
      'N° Documento'
    ];

    if (['compra_activos', 'deuda_bancos', 'leasing', 'otros'].includes(egreso.categoria)) {
      columnas.push('Amortización');
    }

    columnas.push('Estado');

    const dataToExport = egreso.cuotasProyectadas?.map(cuota => {
      const data = {
        'Fecha de Pago': cuota.fechaPago,
        'N° Cuota': cuota.numeroCuota,
        'Valor Cuota': cuota.valorCuota,
        'Fecha Pagada': cuota.fechaPagada || '-',
        'Valor Pagado': cuota.valorPagado || '-',
        'Tipo Documento': cuota.tipoDocumento || '-',
        'N° Documento': cuota.numeroDocumento || '-'
      };

      if (['compra_activos', 'deuda_bancos', 'leasing', 'otros'].includes(egreso.categoria)) {
        data['Amortización'] = cuota.amortizacion || '-';
      }

      data['Estado'] = cuota.estado.charAt(0).toUpperCase() + cuota.estado.slice(1);

      return data;
    });

    exportToExcel(dataToExport, `Amortizacion_y_Pagos_${egreso.nombreCuenta.replace(/\s+/g, '_')}`);
  };

  const getCategoriaLabel = (categoria) => {
    switch (categoria) {
      case 'compra_activos':
        return 'Compra de Activos';
      case 'arriendo':
        return 'Arriendo de Local';
      case 'deuda_bancos':
        return 'Deuda con Bancos';
      case 'leasing':
        return 'Leasing';
      case 'otros':
        return 'Otros Pagos';
      default:
        return categoria;
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Amortización y Pagos de la Deuda</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Información del Egreso */}
            <div className="alert alert-info mb-4">
              <div className="row">
                <div className="col-md-6">
                  <strong>Categoría:</strong> {getCategoriaLabel(egreso.categoria)}<br />
                  <strong>Nombre de la Cuenta:</strong> {egreso.nombreCuenta}
                </div>
                <div className="col-md-6">
                  <strong>Proveedor:</strong> {egreso.proveedor}<br />
                  <strong>RUT:</strong> {egreso.rut}
                </div>
              </div>
            </div>

            {/* Resumen Financiero */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <h6 className="card-title">Total Deuda</h6>
                    <h4>${egreso.valorDeuda?.toLocaleString()}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <h6 className="card-title">Total Pagado</h6>
                    <h4>${egreso.totalPagado?.toLocaleString()}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning text-dark">
                  <div className="card-body">
                    <h6 className="card-title">Saldo Pendiente</h6>
                    <h4>${egreso.restanteDeuda?.toLocaleString()}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <h6 className="card-title">Cuotas Restantes</h6>
                    <h4>{egreso.cuotasRestantes}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Amortización y Pagos */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Amortización y Pagos de la Deuda</h6>
              <button 
                className="btn btn-success btn-sm"
                onClick={handleExportarExcel}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar Excel
              </button>
            </div>

            {renderTablaSegunCategoria()}
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

export default HistorialFinancieroEgreso;