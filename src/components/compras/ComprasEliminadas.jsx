import React, { useEffect, useState } from 'react';
import { listComprasEliminadas } from '../../utils/comprasApi';

function ComprasEliminadas({ onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await listComprasEliminadas({ mes });
        const items = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        setCompras(items);
      } catch (e) {
        setError(e?.message || 'Error cargando compras eliminadas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mes]);

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
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Eliminada</th>
                  <th>ID</th>
                  <th>Proveedor</th>
                  <th>RUT</th>
                  <th>Tipo Documento</th>
                  <th>N° Documento</th>
                  <th>Fecha Compra</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center">Cargando...</td></tr>
                ) : compras.length === 0 ? (
                  <tr><td colSpan={8} className="text-center">Sin registros</td></tr>
                ) : (
                  compras.map((c) => (
                    <tr key={c.id}>
                      <td>{String(c.deleted_at || '').replace('T', ' ').slice(0, 19)}</td>
                      <td>{c.id}</td>
                      <td>{c?.proveedor?.razon_social || c?.proveedor?.nombre_comercial || '-'}</td>
                      <td>{c?.proveedor?.rut || '-'}</td>
                      <td>{c.tipo_documento}</td>
                      <td>{c.folio || '-'}</td>
                      <td>{String(c.fecha || '').slice(0, 10)}</td>
                      <td>${Number(c.total_bruto ?? 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComprasEliminadas;