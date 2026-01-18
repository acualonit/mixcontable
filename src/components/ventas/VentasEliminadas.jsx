import React, { useEffect, useState } from 'react';
import ventasApi from '../../utils/ventasApi';

function VentasEliminadas({ onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    ventasApi
      .listVentasEliminadas({ mes })
      .then((res) => {
        if (!mounted) return;
        setVentas(res?.data ?? []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Error cargando ventas eliminadas', err);
        setError(err?.message || 'Error al cargar ventas eliminadas');
        setVentas([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [mes]);

  const formatMoney = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

  const formatDate = (d) => {
    if (!d) return '';
    try {
      // deleted_at suele venir como string ISO
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toISOString().slice(0, 10);
    } catch {
      return String(d);
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toTimeString().slice(0, 5);
    } catch {
      return '';
    }
  };

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
          {loading && <div>Cargando...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && (
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Fecha Eliminación</th>
                    <th>Hora</th>
                    <th>ID (Interno)</th>
                    <th>Documento de Venta</th>
                    <th>Folio de Venta</th>
                    <th>Total Venta</th>
                    <th>Sucursal</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.length === 0 && (
                    <tr>
                      <td colSpan="8">No hay ventas eliminadas para el mes seleccionado.</td>
                    </tr>
                  )}

                  {ventas.map((v) => (
                    <tr key={v.id}>
                      <td>{formatDate(v.deleted_at)}</td>
                      <td>{formatTime(v.deleted_at)}</td>
                      <td>{v.id}</td>
                      <td>{v.documentoVenta || '-'}</td>
                      <td>{v.folioVenta || '-'}</td>
                      <td>{formatMoney(v.total)}</td>
                      <td>{v.sucursal_nombre || '-'}</td>
                      <td>{v.usuario || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VentasEliminadas;