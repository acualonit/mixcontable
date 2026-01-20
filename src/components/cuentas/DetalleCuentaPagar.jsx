import React, { useEffect, useState } from 'react';
import { getPagosPorVenta, getPagosPorCuenta } from '../../utils/ventasApi';

function DetalleCuentaPagar({ cuenta, onClose }) {
  const [detalle, setDetalle] = useState(cuenta);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const cargarPagos = async () => {
      setCargando(true); setError('');
      try {
        let res = null;
        // Si la cuenta incluye ventaOriginal, usar pagos por venta
        if (cuenta.ventaOriginal && cuenta.ventaOriginal.id) {
          res = await getPagosPorVenta(cuenta.ventaOriginal.id);
        } else if (cuenta.cuentaId) {
          res = await getPagosPorCuenta(cuenta.cuentaId);
        }

        if (res && mounted) {
          const pagos = (res.pagos || []).map(p => ({
            fecha: p.fecha_pago,
            monto: p.monto || p.monto_pagado || 0,
            metodoPago: p.metodo_pago || p.metodo || null,
            comprobante: p.comprobante || p.referencia || null,
            usuario: p.usuario_id || null,
          }));

          setDetalle(prev => ({ ...prev, historialPagos: pagos, montoPagado: res.monto_total || pagos.reduce((s, x) => s + (x.monto || 0), 0) }));
        }
      } catch (e) {
        if (mounted) setError(e?.message || 'Error al cargar pagos');
      } finally {
        if (mounted) setCargando(false);
      }
    };

    cargarPagos();
    return () => { mounted = false; };
  }, [cuenta]);

  const c = detalle || {};

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Detalle de Cuenta por Pagar</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {cargando && <div className="alert alert-info">Cargando pagos...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información del Proveedor</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Proveedor:</th>
                      <td>{c.proveedor}</td>
                    </tr>
                    <tr>
                      <th>RUT:</th>
                      <td>{c.rut}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles de la Deuda</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Origen:</th>
                      <td>{c.origen}</td>
                    </tr>
                    <tr>
                      <th>Documento:</th>
                      <td>{c.documento}</td>
                    </tr>
                    <tr>
                      <th>Fecha Emisión:</th>
                      <td>{c.fechaEmision}</td>
                    </tr>
                    <tr>
                      <th>Fecha Vencimiento:</th>
                      <td>{c.fechaVencimiento}</td>
                    </tr>
                    <tr>
                      <th>Días Mora:</th>
                      <td className={c.diasMora > 0 ? 'text-danger' : ''}>
                        {c.diasMora > 0 ? `${c.diasMora} días` : '-'}
                      </td>
                    </tr>
                    <tr>
                      <th>Monto Total:</th>
                      <td className="fw-bold">${(c.montoTotal || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Monto Pagado:</th>
                      <td className="text-success">${(c.montoPagado || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Saldo Pendiente:</th>
                      <td className="text-danger">${((c.montoTotal || 0) - (c.montoPagado || 0)).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td>
                        <span className={`badge bg-${
                          c.diasMora > 0 ? 'danger' : 
                          (c.montoPagado || 0) === (c.montoTotal || 0) ? 'success' : 
                          'warning'
                        }`}>
                          {c.diasMora > 0 ? 'Vencida' : 
                           (c.montoPagado || 0) === (c.montoTotal || 0) ? 'Pagada' : 
                           'Pendiente'}
                        </span>
                      </td>
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
                    {c.historialPagos?.map((pago, index) => (
                      <tr key={index}>
                        <td>{pago.fecha}</td>
                        <td>${(pago.monto || 0).toLocaleString()}</td>
                        <td>{pago.metodoPago}</td>
                        <td>{pago.comprobante}</td>
                        <td>{pago.usuario}</td>
                      </tr>
                    ))}
                    {(!c.historialPagos || c.historialPagos.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center">No hay pagos registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {c.observaciones && (
              <div className="mb-4">
                <h6>Observaciones</h6>
                <p>{c.observaciones}</p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary">
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleCuentaPagar;