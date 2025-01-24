import React, { useState } from 'react';

function HistorialPagos({ onBack }) {
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
          <h2 className="d-inline">Historial de Pagos</h2>
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
        <div className="card-header bg-success text-white">
          <h5 className="card-title mb-0">Pagos Realizados</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Pago</th>
                  <th>Cliente</th>
                  <th>RUT</th>
                  <th>Documento</th>
                  <th>N° Documento</th>
                  <th>Monto Pagado</th>
                  <th>Método de Pago</th>
                  <th>Comprobante</th>
                  <th>Usuario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01</td>
                  <td>Cliente A</td>
                  <td>12.345.678-9</td>
                  <td>Factura Afecta</td>
                  <td>1234</td>
                  <td>$500,000</td>
                  <td>Efectivo</td>
                  <td>COMP-001</td>
                  <td>Juan Pérez</td>
                  <td>
                    <button className="btn btn-sm btn-primary">
                      <i className="bi bi-eye"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="5">Total</td>
                  <td>$500,000</td>
                  <td colSpan="4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialPagos;