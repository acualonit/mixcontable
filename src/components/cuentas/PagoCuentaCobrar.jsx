import React, { useState, useEffect } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';
import { createMovimientoBanco, fetchCuentas } from '../../utils/bancoApi';
import ventasApi from '../../utils/ventasApi';

function PagoCuentaCobrar({ cuenta, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    metodoPago: {
      tipo: 'efectivo',
      numeroVoucher: '',
      numeroCheque: '',
      fechaCobroCheque: '',
      cuenta_bancaria_id: ''
    },
    incluirFlujoCaja: true,
    observaciones: ''
  });

  const [cuentasBancarias, setCuentasBancarias] = useState([]);

  useEffect(() => {
    // Cargar cuentas bancarias para uso interno (no mostramos select)
    (async () => {
      try {
        try {
          const res = await fetchCuentas();
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          if (Array.isArray(list)) setCuentasBancarias(list || []);
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Resolver automáticamente la cuenta bancaria asociada a la sucursal de la venta
  // cuando el modal se abre o cambia la cuenta seleccionada. Se guarda en
  // formData.metodoPago.cuenta_bancaria_id pero NO se muestra en la UI (campo oculto).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Si la cuenta proviene de una venta, extraer ventaId y pedir detalle
        if (cuenta?.origen === 'Venta' && String(cuenta.id).startsWith('venta-')) {
          const ventaId = Number(String(cuenta.id).replace(/^venta-/, ''));
          if (!isNaN(ventaId) && ventaId > 0) {
            try {
              const ventaDetalle = await ventasApi.getVenta(ventaId);
              const cuentaIdFromVenta = ventaDetalle?.cuenta_bancaria_id ?? ventaDetalle?.cuenta_bancaria ?? null;
              if (mounted && cuentaIdFromVenta) {
                setFormData(fd => ({ ...fd, metodoPago: { ...fd.metodoPago, cuenta_bancaria_id: cuentaIdFromVenta } }));
              }
            } catch (e) {
              // ignore failure to fetch venta
            }
          }
        } else if (cuenta?.cuenta_bancaria_id) {
          // Si la cuenta ya incluye cuenta_bancaria_id, usarla
          if (mounted) setFormData(fd => ({ ...fd, metodoPago: { ...fd.metodoPago, cuenta_bancaria_id: cuenta.cuenta_bancaria_id } }));
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [cuenta]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enviar el pago al componente padre; el backend se encargará de registrar
    // los movimientos en caja o banco para evitar duplicados.
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Registrar Pago</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Cliente:</strong> {cuenta?.cliente}<br />
                <strong>Documento:</strong> {cuenta?.tipoDocumento} N° {cuenta?.numeroDocumento}<br />
                <strong>Saldo Pendiente:</strong> ${(cuenta?.montoTotal - cuenta?.montoPagado)?.toLocaleString()}
              </div>

              <div className="mb-3">
                <label className="form-label">Fecha de Pago</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Monto a Pagar</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  max={cuenta?.montoTotal - cuenta?.montoPagado}
                  required
                />
              </div>

              {/* Método guardado eliminado por solicitud del cliente */}

              <div className="mb-3">
                <label className="form-label">Método de Pago</label>
                <select
                  className="form-select"
                  value={formData.metodoPago.tipo}
                  onChange={(e) => setFormData({
                    ...formData,
                    metodoPago: { ...formData.metodoPago, tipo: e.target.value }
                  })}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="debito">Tarjeta Débito</option>
                  <option value="credito">Tarjeta Crédito</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              {/* Selección de cuenta bancaria para métodos bancarios */}
              {/* Selección de cuenta bancaria eliminada de la UI; el backend elegirá la cuenta por defecto si no se envía */}

              {(formData.metodoPago.tipo === 'debito' || formData.metodoPago.tipo === 'credito') && (
                <div className="mb-3">
                  <label className="form-label">Número de Voucher</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.metodoPago.numeroVoucher}
                    onChange={(e) => setFormData({
                      ...formData,
                      metodoPago: { ...formData.metodoPago, numeroVoucher: e.target.value }
                    })}
                    required
                  />
                </div>
              )}

              {formData.metodoPago.tipo === 'cheque' && (
                <>
                  {/* Campo oculto con la cuenta bancaria resuelta automáticamente */}
                  <input type="hidden" value={formData.metodoPago.cuenta_bancaria_id || ''} />
                  <div className="mb-3">
                    <label className="form-label">Número de Cheque</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.metodoPago.numeroCheque}
                      onChange={(e) => setFormData({
                        ...formData,
                        metodoPago: { ...formData.metodoPago, numeroCheque: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha de Cobro</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.metodoPago.fechaCobroCheque}
                      onChange={(e) => setFormData({
                        ...formData,
                        metodoPago: { ...formData.metodoPago, fechaCobroCheque: e.target.value }
                      })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="incluirFlujoCaja"
                    checked={formData.incluirFlujoCaja}
                    onChange={(e) => setFormData({...formData, incluirFlujoCaja: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="incluirFlujoCaja">
                    Incluir en el Flujo de Caja
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Registrar Pago
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PagoCuentaCobrar;