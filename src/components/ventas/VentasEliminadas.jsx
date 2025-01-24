import React, { useState } from 'react';

function VentasEliminadas({ onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Historial de Ventas Eliminadas</h2>
        </div>
        <div className="d-flex align-items-center">
          <label className="me-2">Mes:</label>
          <input
            type="month"
            className="form-control"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">Ventas Eliminadas</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Eliminación</th>
                  <th>Hora</th>
                  <th>Folio Interno</th>
                  <th>Documento de Venta</th>
                  <th>Folio de Venta</th>
                  <th>Total Venta</th>
                  <th>Sucursal</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01</td>
                  <td>15:30</td>
                  <td>V001</td>
                  <td>Factura Afecta a IVA</td>
                  <td>1234</td>
                  <td>$300,000</td>
                  <td>Central</td>
                  <td>Juan Pérez</td>
                </tr>
                {/* Más filas de ejemplo */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VentasEliminadas;