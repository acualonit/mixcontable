import React, { useEffect, useState } from 'react';
import { getHistorialPagos } from '../../utils/ventasApi';

const parseDate = (val) => {
  if (!val) return null;
  try {
    if (typeof val === 'string') {
      const m = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    const d = new Date(val);
    if (isNaN(d)) return null;
    return d;
  } catch { return null; }
};

const formatDate = (val) => {
  const d = parseDate(val);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatMoney = (v) => {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

function HistorialPagos({ onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [pagos, setPagos] = useState([]);
  const [montoTotal, setMontoTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const cargar = async (m) => {
      setCargando(true); setError('');
      try {
        const res = await getHistorialPagos({ mes: m });
        if (!mounted) return;
        setPagos(res.pagos || []);
        setMontoTotal(res.monto_total || 0);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar historial');
      } finally {
        if (mounted) setCargando(false);
      }
    };
    cargar(mes);
    return () => { mounted = false; };
  }, [mes]);

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
        <div className="card-header bg-success text-white">
          <h5 className="card-title mb-0">Pagos Realizados</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Pago</th>
                  <th>Banco</th>
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
                    <td>{formatDate(p.fecha_pago ?? p.fecha ?? p.created_at)}</td>
                    <td>{p.banco_nombre ?? '-'}</td>
                    <td>${formatMoney(p.monto ?? p.monto_pagado)}</td>
                    <td>{p.metodo_pago}</td>
                    <td>{p.comprobante}</td>
                    <td>{p.usuario ?? (p.usuario_id ? `Usuario #${p.usuario_id}` : '')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="2">Total</td>
                  <td>${formatMoney(montoTotal)}</td>
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

export default HistorialPagos;