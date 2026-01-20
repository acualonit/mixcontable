import React, { useEffect, useState } from 'react';
import { getHistorialPagos } from '../../utils/ventasApi';

function HistorialPagosPagar({ onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [pagos, setPagos] = useState([]);
  const [montoTotal, setMontoTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async (m) => {
    setCargando(true);
    setError('');
    try {
      const res = await getHistorialPagos({ mes: m });
      setPagos(res.pagos || []);
      setMontoTotal(res.monto_total || 0);
    } catch (e) {
      setError(e?.message || 'Error al cargar historial');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(mes); }, [mes]);

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

      {cargando && <div className="alert alert-info">Cargando pagos...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">Pagos Realizados</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Pago</th>
                  <th>Cuenta/Venta</th>
                  <th>Monto Pagado</th>
                  <th>Método de Pago</th>
                  <th>Comprobante</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No se encontraron pagos</td>
                  </tr>
                )}
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.fecha_pago}</td>
                    <td>{p.venta_id ? `Venta ${p.venta_id}` : (p.cuenta_cobrar_id ? `Cuenta ${p.cuenta_cobrar_id}` : '-')}</td>
                    <td>${Number(p.monto).toLocaleString()}</td>
                    <td>{p.metodo_pago}</td>
                    <td>{p.comprobante}</td>
                    <td>{p.usuario_id}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="2">Total</td>
                  <td>${Number(montoTotal).toLocaleString()}</td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialPagosPagar;