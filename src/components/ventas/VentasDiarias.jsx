import React, { useState } from 'react';

function VentasDiarias({ fecha, onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [sucursal, setSucursal] = useState('');

  const handleExportExcel = () => {
    // Aquí se implementará la lógica para exportar a Excel
    console.log('Exportando a Excel...');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Ventas Diarias</h2>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <label className="me-2">Mes:</label>
            <input
              type="month"
              className="form-control"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center">
            <label className="me-2">Sucursal:</label>
            <select 
              className="form-select"
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              <option value="central">Sucursal Central</option>
              <option value="norte">Sucursal Norte</option>
              <option value="sur">Sucursal Sur</option>
            </select>
          </div>
          <button 
            className="btn btn-success"
            onClick={handleExportExcel}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Descargar Excel
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Ventas Diarias</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Folio Interno</th>
                  <th>Sucursal</th>
                  <th>Documento de Venta</th>
                  <th>Folio de Venta</th>
                  <th>Efectivo</th>
                  <th>Transferencia</th>
                  <th>T. Crédito</th>
                  <th>N° Voucher</th>
                  <th>T. Débito</th>
                  <th>N° Voucher</th>
                  <th>Cheque</th>
                  <th>N° Cheque</th>
                  <th>Pago Online</th>
                  <th>Venta a Crédito</th>
                  <th>Total Venta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01</td>
                  <td>V001</td>
                  <td>Central</td>
                  <td>Factura Afecta a IVA</td>
                  <td>1234</td>
                  <td>$100,000</td>
                  <td>$0</td>
                  <td>$200,000</td>
                  <td>VC001</td>
                  <td>$0</td>
                  <td>-</td>
                  <td>$0</td>
                  <td>-</td>
                  <td>$0</td>
                  <td>$0</td>
                  <td>$300,000</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-primary">
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-warning">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-info">
                        <i className="bi bi-printer"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Más filas de ejemplo */}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="5">TOTAL DEL DÍA</td>
                  <td>$500,000</td>
                  <td>$300,000</td>
                  <td>$400,000</td>
                  <td></td>
                  <td>$200,000</td>
                  <td></td>
                  <td>$0</td>
                  <td></td>
                  <td>$100,000</td>
                  <td>$150,000</td>
                  <td>$1,650,000</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VentasDiarias;