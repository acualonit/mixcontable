import React from 'react';

function Principal({ currentDateTime }) {
  return (
    <div className="container mt-4">
      <header className="mb-4 text-center">
        <h1>Mi Empresa SpA</h1>
        <p><strong>Estado del Sistema:</strong> <span className="text-success">En línea</span></p>
      </header>

      <div className="info-bar mb-4">
        <div>
          <strong>Fecha:</strong> <span>{currentDateTime}</span>
        </div>
        <div>
          <strong>Dólar Hoy:</strong> <span>$800</span>
        </div>
        <div>
          <strong>Valor UF Hoy:</strong> <span>$32,000</span>
        </div>
      </div>

      <div className="row">
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header bg-danger text-white">
              <h5 className="card-title mb-0">ACCIONES PENDIENTES POR PAGAR</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-danger">
                    <tr>
                      <th>Cuenta</th>
                      <th>Detalle</th>
                      <th>Fecha de Pago</th>
                      <th>Valor</th>
                      <th>Visualizar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cuentas Por Pagar</td>
                      <td>Pago a proveedor ABC</td>
                      <td>15/12/2023</td>
                      <td className="text-danger">$1,500,000</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                    {/* Más filas... */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">ACCIONES PENDIENTES QUE SON INGRESO</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-success">
                    <tr>
                      <th>Cuenta</th>
                      <th>Detalle</th>
                      <th>Fecha de Pago</th>
                      <th>Valor</th>
                      <th>Visualizar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cuentas Por Cobrar</td>
                      <td>Factura cliente XYZ</td>
                      <td>10/12/2023</td>
                      <td className="text-success">$2,800,000</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                    {/* Más filas... */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Principal;