import React, { useState } from 'react';

function Efectivo() {
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    fecha: new Date().toISOString().split('T')[0],
    valor: '',
    detalle: '',
    tipo: 'ingreso'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí irá la lógica para guardar el movimiento
    console.log('Nuevo movimiento:', nuevoMovimiento);
    setShowNuevoMovimiento(false);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Control de Efectivo</h2>
        <button 
          className="btn btn-primary btn-sm px-3 py-2"
          onClick={() => setShowNuevoMovimiento(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Nuevo Movimiento
        </button>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Saldo Actual</h5>
              <h3>$2,500,000</h3>
            </div>
          </div>
        </div>
      </div>

      {/* El resto del código permanece igual */}
      {showNuevoMovimiento && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Nuevo Movimiento de Efectivo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNuevoMovimiento(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={nuevoMovimiento.fecha}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        fecha: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Valor</label>
                    <input
                      type="number"
                      className="form-control"
                      value={nuevoMovimiento.valor}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        valor: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Detalle</label>
                    <textarea
                      className="form-control"
                      value={nuevoMovimiento.detalle}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        detalle: e.target.value
                      })}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-select"
                      value={nuevoMovimiento.tipo}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        tipo: e.target.value
                      })}
                      required
                    >
                      <option value="ingreso">Ingreso de Efectivo</option>
                      <option value="egreso">Salida de Efectivo</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowNuevoMovimiento(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header bg-light">
          <div className="row align-items-center">
            <div className="col-md-4">
              <label className="form-label mb-0">Filtrar por fecha:</label>
              <input
                type="date"
                className="form-control"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-secondary text-white">
          <h5 className="card-title mb-0">Movimientos de Efectivo</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Detalle</th>
                  <th>Tipo de Movimiento</th>
                  <th>Categoría</th>
                  <th>Sucursal</th>
                  <th>Monto</th>
                  <th>Saldo</th>
                  <th>Usuario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01</td>
                  <td>Venta del día</td>
                  <td><span className="badge bg-success">Ingreso</span></td>
                  <td>Venta</td>
                  <td>Central</td>
                  <td className="text-success">$500,000</td>
                  <td>$2,500,000</td>
                  <td>Juan Pérez</td>
                  <td>
                    <button className="btn btn-sm btn-primary me-1">
                      <i className="bi bi-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-warning me-1">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger">
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>2023-12-01</td>
                  <td>Pago servicios básicos</td>
                  <td><span className="badge bg-danger">Egreso</span></td>
                  <td>Gasto</td>
                  <td>Norte</td>
                  <td className="text-danger">$200,000</td>
                  <td>$2,300,000</td>
                  <td>María González</td>
                  <td>
                    <button className="btn btn-sm btn-primary me-1">
                      <i className="bi bi-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-warning me-1">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger">
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="5">TOTAL</td>
                  <td>$300,000</td>
                  <td>$2,300,000</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Efectivo;