import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function NuevoGasto({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    sucursal: '',
    categoria: '',
    descripcion: '',
    tipoDocumento: '',
    numeroDocumento: '',
    monto: '',
    metodoPago: {
      tipo: 'efectivo',
      numeroVoucher: '',
      numeroCheque: '',
      fechaCobroCheque: '',
      fechaPagoCredito: ''
    },
    metodoDescuento: 'efectivo',
    observaciones: ''
  });

  const calcularTotales = () => {
    const monto = parseFloat(formData.monto) || 0;
    
    // Determinar si el documento es afecto a IVA
    const documentosAfectosIVA = [
      'factura_afecta',
      'boleta_afecta',
      'voucher_credito',
      'voucher_debito'
    ];
    const esAfectoIVA = documentosAfectosIVA.includes(formData.tipoDocumento);

    if (esAfectoIVA) {
      // Si es afecto a IVA, calcular subtotal e IVA
      const subtotal = Math.round(monto / 1.19);
      const iva = monto - subtotal;
      return { subtotal, iva, total: monto };
    } else {
      // Si no es afecto a IVA, el subtotal es igual al total y el IVA es 0
      return {
        subtotal: monto,
        iva: 0,
        total: monto
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si el método de descuento es efectivo y el pago es en efectivo,
    // registrar el movimiento en efectivo
    if (formData.metodoDescuento === 'efectivo' && formData.metodoPago.tipo === 'efectivo') {
      try {
        await registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: parseFloat(formData.monto),
          detalle: `Gasto - ${formData.categoria}: ${formData.descripcion}`,
          tipo: 'egreso',
          categoria: 'Gasto',
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
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Nuevo Gasto</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
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
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="operativos">Gastos Operativos</option>
                    <option value="administrativos">Gastos Administrativos</option>
                    <option value="marketing">Marketing y Publicidad</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="servicios">Servicios Básicos</option>
                    <option value="otros">Otros Gastos</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Descripción</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Tipo de Documento</label>
                  <select
                    className="form-select"
                    value={formData.tipoDocumento}
                    onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar documento</option>
                    <option value="factura_afecta">Factura Afecta a IVA</option>
                    <option value="factura_exenta">Factura Exenta a IVA</option>
                    <option value="boleta_afecta">Boleta Afecta IVA</option>
                    <option value="boleta_exenta">Boleta Exenta a IVA</option>
                    <option value="boleta_honorarios">Boleta de Honorarios</option>
                    <option value="voucher_credito">Voucher Tarjeta Crédito</option>
                    <option value="voucher_debito">Voucher Tarjeta Débito</option>
                    <option value="otro">Otro Documento</option>
                    <option value="sin_documento">Sin Documento</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Número de Documento</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numeroDocumento}
                    onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})}
                    required={formData.tipoDocumento !== 'sin_documento'}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Monto</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
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
                    <option value="credito_deuda">Crédito (Deuda)</option>
                  </select>
                </div>
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
                <div className="row mb-3">
                  <div className="col-md-6">
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
                  <div className="col-md-6">
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
                </div>
              )}

              {formData.metodoPago.tipo === 'credito_deuda' && (
                <div className="mb-3">
                  <label className="form-label">Fecha de Pago</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.metodoPago.fechaPagoCredito}
                    onChange={(e) => setFormData({
                      ...formData,
                      metodoPago: { ...formData.metodoPago, fechaPagoCredito: e.target.value }
                    })}
                    required
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Método para Descontar</label>
                <select
                  className="form-select"
                  value={formData.metodoDescuento}
                  onChange={(e) => setFormData({...formData, metodoDescuento: e.target.value})}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="banco">Banco</option>
                  <option value="no_descontar">No Descontar</option>
                </select>
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

              <div className="row justify-content-end">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      {(() => {
                        const { subtotal, iva, total } = calcularTotales();
                        return (
                          <>
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Subtotal:</strong>
                              <span>${subtotal.toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <strong>IVA{iva > 0 ? ' (19%)' : ''}:</strong>
                              <span>${iva.toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <strong>Total:</strong>
                              <span className="fw-bold">${total.toLocaleString()}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger">
                <i className="bi bi-check-circle me-2"></i>
                Guardar Gasto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevoGasto;