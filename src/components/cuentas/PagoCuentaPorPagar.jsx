import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function PagoCuentaPorPagar({ onClose, onSave, cuenta }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    sucursal: '',
    monto: cuenta?.monto || 0,
    metodoPago: {
      tipo: 'efectivo',
      numeroVoucher: '',
      numeroCheque: '',
      fechaCobroCheque: ''
    },
    incluirFlujoCaja: true,
    observaciones: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si el pago es en efectivo y está marcado para incluir en flujo de caja,
    // registrar el movimiento en efectivo
    if (formData.incluirFlujoCaja && formData.metodoPago.tipo === 'efectivo') {
      try {
        await registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: formData.monto,
          detalle: `Pago cuenta por pagar - ${cuenta?.proveedor}`,
          tipo: 'egreso',
          categoria: 'Cuenta por Pagar',
          sucursal: formData.sucursal
        });
      } catch (error) {
        alert(error.message);
        return;
      }
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Registrar Pago</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Proveedor:</strong> {cuenta?.proveedor}<br />
                <strong>Documento:</strong> {cuenta?.documento}<br />
                <strong>Saldo Pendiente:</strong> ${cuenta?.monto.toLocaleString()}
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
                <label className="form-label">Sucursal</label>
                <select
                  className="form-select"
                  value={formData.sucursal}
                  onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                  required
                >
                  <option value="">Seleccionar sucursal</option>
                  <option value="central">Sucursal Central</option>
                  <option value="norte">Sucursal Norte</option>
                  <option value="sur">Sucursal Sur</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Monto a Pagar</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value)})}
                  max={cuenta?.monto}
                  required
                />
              </div>

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
              <button type="submit" className="btn btn-danger">
                Registrar Pago
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PagoCuentaPorPagar;