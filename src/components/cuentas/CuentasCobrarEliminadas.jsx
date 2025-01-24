import React, { useState } from 'react';

function CuentasCobrarEliminadas({ onBack }) {
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
          <h2 className="d-inline">Cuentas por Cobrar Eliminadas</h2>
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
          <h5 className="card-title mb-0">Cuentas Eliminadas</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Eliminación</th>
                  <th>Cliente</th>
                  <th>RUT</th>
                  <th>Documento</th>
                  <th>N° Documento</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Vencimiento</th>
                  <th>Monto Total</th>
                  <th>Monto Pagado</th>
                  <th>Saldo</th>
                  <th>Usuario</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01 15:30</td>
                  <td>Cliente A</td>
                  <td>12.345.678-9</td>
                  <td>Factura Afecta</td>
                  <td>1234</td>
                  <td>2023-11-15</td>
                  <td>2023-12-15</td>
                  <td>$1,000,000</td>
                  <td>$500,000</td>
                  <td>$500,000</td>
                  <td>Juan Pérez</td>
                  <td>Documento anulado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CuentasCobrarEliminadas;