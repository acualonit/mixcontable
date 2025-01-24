import React, { useState } from 'react';

function FlujoCaja() {
  const [periodo, setPeriodo] = useState('mensual');

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Flujo de Caja</h2>
      
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Control de Flujo de Caja</h5>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-4">
              <select 
                className="form-select" 
                value={periodo} 
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary">
                Generar Reporte
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Concepto</th>
                  <th>Ingresos</th>
                  <th>Egresos</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ventas</td>
                  <td className="text-success">$5,000,000</td>
                  <td>-</td>
                  <td>$5,000,000</td>
                </tr>
                <tr>
                  <td>Gastos Operativos</td>
                  <td>-</td>
                  <td className="text-danger">$2,000,000</td>
                  <td>$3,000,000</td>
                </tr>
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <th>Total</th>
                  <th className="text-success">$5,000,000</th>
                  <th className="text-danger">$2,000,000</th>
                  <th>$3,000,000</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-info text-white">
          <h5 className="card-title mb-0">Gráfico de Flujo</h5>
        </div>
        <div className="card-body">
          <p>Aquí irá el gráfico de flujo de caja</p>
        </div>
      </div>
    </div>
  );
}

export default FlujoCaja;