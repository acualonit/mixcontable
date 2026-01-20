import React, { useEffect, useMemo, useState } from 'react';
import ventasApi from '../../utils/ventasApi';

function CuentasCobrarEliminadas({ onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ventas, setVentas] = useState([]);

  const matchCreditoDeuda = (v) => {
    const raw = String(v?.metodos_pago ?? v?.metodo_pago ?? v?.metodoPago ?? '').toLowerCase();
    if (!raw) return false;
    // aceptar variantes típicas
    return raw.includes('credito') && (raw.includes('deuda') || raw.includes('(deuda)'));
  };

  const formatDate = (val) => {
    if (!val) return '';
    const s = String(val);
    // soportar 'YYYY-MM-DD' o 'YYYY-MM-DD HH:mm:ss' o ISO
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const yyyy = m[1];
      const mm = m[2];
      const dd = m[3];
      return `${dd}/${mm}/${yyyy}`;
    }
    // fallback: intentar parseo nativo
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return s;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ventasApi.listVentasEliminadas({ mes });
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        const filtered = (list || []).filter(matchCreditoDeuda);
        if (!mounted) return;
        setVentas(filtered);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'No se pudieron cargar las ventas eliminadas');
        setVentas([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [mes]);

  const rows = useMemo(() => {
    return (ventas || []).map(v => {
      const montoTotal = Number(v.total ?? v.monto_total ?? 0) || 0;
      const montoPagado = Number(v.monto_pagado ?? v.montoPagado ?? v.pagado ?? 0) || 0;
      const saldo = Math.max(0, montoTotal - montoPagado);

      const clienteObj = typeof v.cliente === 'object' && v.cliente ? v.cliente : null;
      const cliente = typeof v.cliente === 'string'
        ? v.cliente
        : (
            clienteObj?.nombre ||
            clienteObj?.razon_social ||
            clienteObj?.name ||
            v.cliente_nombre ||
            v.razon_social ||
            v.nombre_cliente ||
            ''
          );

      const rut =
        clienteObj?.rut ||
        v.cliente_rut ||
        v.rut ||
        v.rut_cliente ||
        '';

      const docTipo = v.documentoVenta || v.documento_venta || v.tipo_documento || v.tipoDocumento || v.documento || '';
      const docNum = v.folioVenta || v.folio_venta || v.folio || v.numero || v.numero_documento || v.nro_documento || '';

      const fechaEmision = v.fecha ?? v.fecha_emision ?? '';
      const fechaVenc = v.fecha_final ?? v.fecha_vencimiento ?? '';
      const fechaEliminacion = v.deleted_at || v.fecha_eliminacion || '';

      const usuario = v.usuario_join || v.usuario || v.usuario_nombre || '';
      const motivo = v.motivo_eliminacion || v.motivo || v.observaciones || '';

      return {
        id: v.id,
        fechaEliminacion,
        cliente,
        rut,
        docTipo,
        docNum,
        fechaEmision,
        fechaVenc,
        montoTotal,
        montoPagado,
        saldo,
        usuario,
        motivo,
      };
    });
  }, [ventas]);

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
          <h5 className="card-title mb-0">Ventas Eliminadas (Crédito/Deuda)</h5>
        </div>
        <div className="card-body">
          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : null}

          {loading ? (
            <div className="text-muted">Cargando...</div>
          ) : (
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
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center text-muted">
                        No hay ventas eliminadas de Crédito (Deuda) para el mes seleccionado.
                      </td>
                    </tr>
                  ) : (
                    rows.map(r => (
                      <tr key={r.id}>
                        <td>{formatDate(r.fechaEliminacion)}</td>
                        <td>{r.cliente}</td>
                        <td>{r.rut}</td>
                        <td>{r.docTipo}</td>
                        <td>{r.docNum}</td>
                        <td>{formatDate(r.fechaEmision)}</td>
                        <td>{formatDate(r.fechaVenc)}</td>
                        <td>{`$${Number(r.montoTotal || 0).toLocaleString()}`}</td>
                        <td>{`$${Number(r.montoPagado || 0).toLocaleString()}`}</td>
                        <td>{`$${Number(r.saldo || 0).toLocaleString()}`}</td>
                        <td>{r.usuario}</td>
                        <td>{r.motivo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CuentasCobrarEliminadas;