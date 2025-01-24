import React, { useState } from 'react';

function ComprasEliminadas({ onBack }) {
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
          <h2 className="d-inline">Historial de Compras Eliminadas</h2>
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
          <h5 className="card-title mb-0">Compras Eliminadas</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Eliminada</th>
                  <th>N° Interno</th>
                  <th>Proveedor</th>
                  <th>RUT</th>
                  <th>Tipo Documento</th>
                  <th>N° Documento</th>
                  <th>Fecha Compra</th>
                  <th>Valor</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01 15:30</td>
                  <td>COMP-001</td>
                  <td>Proveedor A</td>
                  <td>76.123.456-7</td>
                  <td>Factura Afecta</td>
                  <td>1234</td>
                  <td>2023-12-01</td>
                  <td>$800,000</td>
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

export default ComprasEliminadas;