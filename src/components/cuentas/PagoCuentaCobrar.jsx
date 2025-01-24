import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function PagoCuentaCobrar({ cuenta, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
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
          valor: parseFloat(formData.monto),
          detalle: `Cobro cuenta por cobrar - ${cuenta?.cliente} - Doc: ${cuenta?.numeroDocumento}`,
          tipo: 'ingreso',
          categoria: 'Cuenta por Cobrar',
          sucursal: cuenta?.sucursal
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