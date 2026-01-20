import React, { useEffect, useState } from 'react';
import ventasApi from '../../utils/ventasApi';

// Helper para parsear fechas y formatear a DD/MM/YYYY
const parseDate = (val) => {
  if (!val) return null;
  try {
    if (typeof val === 'string') {
      const m = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const day = Number(m[3]);
        const dLocal = new Date(y, mo, day);
        if (!isNaN(dLocal)) return dLocal;
      }
    }
    const d = new Date(val);
    if (isNaN(d)) return null;
    return d;
  } catch {
    return null;
  }
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

function DetalleCuentaCobrar({ cuenta, onClose }) {
  const [detalle, setDetalle] = useState(cuenta);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setDetalle(cuenta);
    setError('');

    const cargarPagosSiNecesario = async () => {
      try {
        if (!mounted) return;
        // Si ya vienen pagos en la cuenta, no pedirlos
        if (cuenta?.historialPagos && cuenta.historialPagos.length > 0) return;

        setCargando(true);
        let res = null;
        // Caso: cuenta viene de una venta mapeada con id 'venta-<id>'
        if (cuenta && String(cuenta.id).startsWith('venta-')) {
          const ventaId = String(cuenta.id).replace(/^venta-/, '');
          try { res = await ventasApi.getPagosPorVenta(ventaId); } catch (e) { res = null; }
        } else if (cuenta && (typeof cuenta.id === 'number' || /^\d+$/.test(String(cuenta.id)))) {
          // Si es una cuenta con id numérico, pedir pagos por cuenta
          try { res = await ventasApi.getPagosPorCuenta(cuenta.id); } catch (e) { res = null; }
        }

        if (!mounted) return;
        if (res && Array.isArray(res.pagos) && res.pagos.length > 0) {
          const pagosNorm = res.pagos.map(p => ({
            fecha: p.fecha_pago ?? p.fecha ?? p.created_at ?? null,
            monto: Number(p.monto ?? p.monto_pagado ?? p.valor ?? p.importe ?? 0) || 0,
            metodoPago: p.metodo_pago ?? p.metodo ?? p.tipo ?? null,
            comprobante: p.comprobante ?? p.referencia ?? p.nota ?? null,
            usuario: p.usuario ?? p.usuario_id ?? p.user_id ?? p.created_by ?? null,
          }));

          setDetalle(prev => ({ ...prev, historialPagos: pagosNorm, montoPagado: res.monto_total ?? pagosNorm.reduce((s, x) => s + (x.monto || 0), 0) }));
        }
      } catch (e) {
        if (mounted) setError('Error cargando pagos: ' + (e?.message || e));
      } finally {
        if (mounted) setCargando(false);
      }
    };

    cargarPagosSiNecesario();

    return () => { mounted = false; };
  }, [cuenta]);

  if (!detalle) return null;

  // Campos con posibles nombres distintos en origen de datos
  const contacto = detalle.contacto ?? detalle.contacto_nombre ?? detalle.cliente_contacto ?? '';
  const telefono = detalle.telefono ?? detalle.telefono_contacto ?? detalle.contacto_telefono ?? '';
  const numeroDocumento = detalle.cuentaId ?? detalle.cuenta_cobrar_id ?? detalle.numeroDocumento ?? detalle.documento ?? detalle.folio ?? detalle.numero ?? '';
  const tipoDocumento = detalle.tipoDocumento ?? detalle.tipo_documento ?? detalle.documentoTipo ?? '';
  // Mostrar las fechas tal cual vienen de la base de datos
  const fechaEmision = detalle.fechaEmision ?? detalle.fecha ?? detalle.fecha_emision ?? '';
  const fechaVencimiento = detalle.fechaVencimiento ?? detalle.fecha_final ?? detalle.fecha_vencimiento ?? '';
  const montoTotal = Number(detalle.montoTotal ?? detalle.total ?? detalle.monto ?? 0);
  const montoPagado = Number((detalle.montoPagado ?? detalle.monto_pagado ?? detalle.pagado ?? 0));
  const saldoPendiente = Math.max(0, montoTotal - montoPagado);

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Detalle de Cuenta por Cobrar</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {cargando && <div className="alert alert-info">Cargando pagos...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información del Cliente</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Cliente:</th>
                      <td>{detalle.cliente}</td>
                    </tr>
                    <tr>
                      <th>RUT:</th>
                      <td>{detalle.rut}</td>
                    </tr>
                    <tr>
                      <th>Contacto:</th>
                      <td>{contacto}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{telefono}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles de la Deuda</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>N° Documento:</th>
                      <td>{numeroDocumento}</td>
                    </tr>
                    <tr>
                      <th>Tipo Documento:</th>
                      <td>{tipoDocumento}</td>
                    </tr>
                    <tr>
                      <th>Fecha Emisión:</th>
                      <td>{formatDate(fechaEmision)}</td>
                    </tr>
                    <tr>
                      <th>Fecha Vencimiento:</th>
                      <td>{formatDate(fechaVencimiento)}</td>
                    </tr>
                    <tr>
                      <th>Monto Total:</th>
                      <td className="fw-bold">${formatMoney(montoTotal)}</td>
                    </tr>
                    <tr>
                      <th>Monto Pagado:</th>
                      <td className="text-success">${formatMoney(montoPagado)}</td>
                    </tr>
                    <tr>
                      <th>Saldo Pendiente:</th>
                      <td className="text-danger">${formatMoney(saldoPendiente)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Historial de Pagos</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Método de Pago</th>
                      <th>Comprobante</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.historialPagos?.map((pago, index) => (
                      <tr key={index}>
                        <td>{formatDate(pago.fecha ?? pago.fecha_pago ?? pago.created_at)}</td>
                        <td>${formatMoney(pago.monto)}</td>
                        <td>{pago.metodoPago ?? pago.metodo ?? pago.metodo_pago}</td>
                        <td>{pago.comprobante}</td>
                        <td>{pago.usuario ?? (pago.usuario_id ? `Usuario #${pago.usuario_id}` : '')}</td>
                      </tr>
                    ))}
                    {(!detalle.historialPagos || detalle.historialPagos.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center">No hay pagos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Observaciones</h6>
              <p>{detalle.observaciones ?? detalle.observacion ?? 'Sin observaciones'}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-success">
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleCuentaCobrar;