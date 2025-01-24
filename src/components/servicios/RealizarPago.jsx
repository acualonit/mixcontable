import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function RealizarPago({ servicio, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: servicio.montoEstimado,
    metodoPago: 'efectivo',
    numeroVoucher: '',
    numeroCheque: '',
    fechaCobroCheque: '',
    datosBancarios: {
      nombreCuenta: '',
      rut: '',
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      correo: ''
    },
    incluirFlujoCaja: true,
    observaciones: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si el pago es en efectivo y está marcado para incluir en flujo de caja,
    // registrar el movimiento en efectivo
    if (formData.incluirFlujoCaja && formData.metodoPago === 'efectivo') {
      try {
        await registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: formData.monto,
          detalle: `Pago servicio ${servicio.servicio} - ${servicio.proveedor}`,
          tipo: 'egreso',
          categoria: 'Servicio',
          sucursal: servicio.sucursal
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
            <h5 className="modal-title">Realizar Pago</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Servicio:</strong> {servicio.servicio}<br />
                <strong>Proveedor:</strong> {servicio.proveedor}<br />
                <strong>Monto a Pagar:</strong> ${servicio.montoEstimado.toLocaleString()}
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
                <label className="form-label">Monto</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value)})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Método de Pago</label>
                <select
                  className="form-select"
                  value={formData.metodoPago}
                  onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="debito">Tarjeta Débito</option>
                  <option value="credito">Tarjeta Crédito</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              {(formData.metodoPago === 'debito' || formData.metodoPago === 'credito') && (
                <div className="mb-3">
                  <label className="form-label">Número de Voucher</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numeroVoucher}
                    onChange={(e) => setFormData({...formData, numeroVoucher: e.target.value})}
                    required
                  />
                </div>
              )}

              {formData.metodoPago === 'cheque' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Número de Cheque</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.numeroCheque}
                      onChange={(e) => setFormData({...formData, numeroCheque: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha de Cobro</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.fechaCobroCheque}
                      onChange={(e) => setFormData({...formData, fechaCobroCheque: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              {formData.metodoPago === 'transferencia' && (
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0">Datos Bancarios</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nombre de Cuenta</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.datosBancarios.nombreCuenta}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              nombreCuenta: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">RUT</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.datosBancarios.rut}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              rut: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Banco</label>
                        <select
                          className="form-select"
                          value={formData.datosBancarios.banco}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              banco: e.target.value
                            }
                          })}
                          required
                        >
                          <option value="">Seleccionar banco</option>
                          <option value="banco_estado">Banco Estado</option>
                          <option value="banco_chile">Banco de Chile</option>
                          <option value="banco_santander">Banco Santander</option>
                          <option value="banco_bci">Banco BCI</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo de Cuenta</label>
                        <select
                          className="form-select"
                          value={formData.datosBancarios.tipoCuenta}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              tipoCuenta: e.target.value
                            }
                          })}
                          required
                        >
                          <option value="">Seleccionar tipo</option>
                          <option value="corriente">Cuenta Corriente</option>
                          <option value="vista">Cuenta Vista</option>
                          <option value="ahorro">Cuenta de Ahorro</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Número de Cuenta</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.datosBancarios.numeroCuenta}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              numeroCuenta: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Correo</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.datosBancarios.correo}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              correo: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  rows="2"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Realizar Pago
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RealizarPago;