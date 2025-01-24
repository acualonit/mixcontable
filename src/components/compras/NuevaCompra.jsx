import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function NuevaCompra({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    sucursal: '',
    documentoCompra: '',
    folioCompra: '',
    proveedor: '',
    items: [{ descripcion: '', cantidad: 1, valor: 0 }],
    metodoPago1: {
      tipo: 'efectivo',
      monto: 0,
      numeroVoucher: '',
      numeroCheque: '',
      fechaCobroCheque: '',
      fechaPagoCredito: ''
    },
    metodoPago2: {
      tipo: '',
      monto: 0,
      numeroVoucher: '',
      numeroCheque: '',
      fechaCobroCheque: '',
      fechaPagoCredito: ''
    },
    metodoDescuento: 'efectivo',
    observaciones: ''
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { descripcion: '', cantidad: 1, valor: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleMetodoPagoChange = (metodoPagoNum, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`metodoPago${metodoPagoNum}`]: {
        ...prev[`metodoPago${metodoPagoNum}`],
        [field]: value
      }
    }));
  };

  const calcularTotales = () => {
    const total = formData.items.reduce((total, item) => {
      return total + (item.cantidad * item.valor);
    }, 0);

    // Determinar si el documento es afecto a IVA
    const documentosAfectosIVA = [
      'factura_afecta',
      'boleta_afecta',
      'voucher_credito',
      'voucher_debito'
    ];
    const esAfectoIVA = documentosAfectosIVA.includes(formData.documentoCompra);

    if (esAfectoIVA) {
      // Si es afecto a IVA, calcular subtotal e IVA
      const subtotal = Math.round(total / 1.19);
      const iva = total - subtotal;
      return { subtotal, iva, total };
    } else {
      // Si no es afecto a IVA, el subtotal es igual al total y el IVA es 0
      return {
        subtotal: total,
        iva: 0,
        total
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subtotal, iva, total } = calcularTotales();

    // Validar que la suma de los montos de pago sea igual al total
    const totalPagos = formData.metodoPago1.monto + (formData.metodoPago2.tipo ? formData.metodoPago2.monto : 0);
    if (totalPagos !== total) {
      alert('La suma de los montos de pago debe ser igual al total de la compra');
      return;
    }

    // Si el método de descuento es efectivo y hay pago en efectivo,
    // registrar el movimiento en efectivo
    if (formData.metodoDescuento === 'efectivo') {
      if (formData.metodoPago1.tipo === 'efectivo') {
        try {
          await registrarMovimientoEfectivo({
            fecha: formData.fecha,
            valor: formData.metodoPago1.monto,
            detalle: `Compra en efectivo - ${formData.documentoCompra} ${formData.folioCompra}`,
            tipo: 'egreso',
            categoria: 'Compra',
            sucursal: formData.sucursal
          });
        } catch (error) {
          alert(error.message);
          return;
        }
      }
      if (formData.metodoPago2.tipo === 'efectivo') {
        try {
          await registrarMovimientoEfectivo({
            fecha: formData.fecha,
            valor: formData.metodoPago2.monto,
            detalle: `Compra en efectivo - ${formData.documentoCompra} ${formData.folioCompra}`,
            tipo: 'egreso',
            categoria: 'Compra',
            sucursal: formData.sucursal
          });
        } catch (error) {
          alert(error.message);
          return;
        }
      }
    }

    const compraData = {
      ...formData,
      subtotal,
      iva,
      total,
      estado: formData.metodoPago1.tipo === 'credito_deuda' || formData.metodoPago2.tipo === 'credito_deuda' ? 'pendiente' : 'pagada'
    };

    onSave(compraData);
    onClose();
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nueva Compra</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-3">
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
                <div className="col-md-3">
                  <label className="form-label">Documento de Compra</label>
                  <select
                    className="form-select"
                    value={formData.documentoCompra}
                    onChange={(e) => setFormData({...formData, documentoCompra: e.target.value})}
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
                <div className="col-md-3">
                  <label className="form-label">Folio</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.folioCompra}
                    onChange={(e) => setFormData({...formData, folioCompra: e.target.value})}
                    required={formData.documentoCompra !== 'sin_documento'}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Proveedor</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar proveedor..."
                      value={formData.proveedor}
                      onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                      required
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => {/* Implementar búsqueda de proveedor */}}
                    >
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6>Detalle de Compra</h6>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-success"
                    onClick={handleAddItem}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Agregar Ítem
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="row mb-2 align-items-end">
                    <div className="col-md-5">
                      <label className="form-label">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
                        value={item.descripcion}
                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Cantidad</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Valor (con IVA)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={item.valor}
                        onChange={(e) => handleItemChange(index, 'valor', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-md-2">
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm w-100"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Primer Método de Pago */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Primer Método de Pago</label>
                  <select 
                    className="form-select"
                    value={formData.metodoPago1.tipo}
                    onChange={(e) => handleMetodoPagoChange(1, 'tipo', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar método</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="debito">Tarjeta Débito</option>
                    <option value="credito">Tarjeta Crédito</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Pago Online</option>
                    <option value="credito_deuda">Crédito (Deuda)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Monto</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.metodoPago1.monto}
                    onChange={(e) => handleMetodoPagoChange(1, 'monto', parseFloat(e.target.value))}
                    required
                  />
                </div>
                {(formData.metodoPago1.tipo === 'debito' || formData.metodoPago1.tipo === 'credito') && (
                  <div className="col-md-4">
                    <label className="form-label">Número de Voucher</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.metodoPago1.numeroVoucher}
                      onChange={(e) => handleMetodoPagoChange(1, 'numeroVoucher', e.target.value)}
                      required
                    />
                  </div>
                )}
                {formData.metodoPago1.tipo === 'cheque' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label">Número de Cheque</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.metodoPago1.numeroCheque}
                        onChange={(e) => handleMetodoPagoChange(1, 'numeroCheque', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Fecha de Cobro</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.metodoPago1.fechaCobroCheque}
                        onChange={(e) => handleMetodoPagoChange(1, 'fechaCobroCheque', e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                {formData.metodoPago1.tipo === 'credito_deuda' && (
                  <div className="col-md-4">
                    <label className="form-label">Fecha de Pago</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.metodoPago1.fechaPagoCredito}
                      onChange={(e) => handleMetodoPagoChange(1, 'fechaPagoCredito', e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Segundo Método de Pago */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Segundo Método de Pago (Opcional)</label>
                  <select 
                    className="form-select"
                    value={formData.metodoPago2.tipo}
                    onChange={(e) => handleMetodoPagoChange(2, 'tipo', e.target.value)}
                  >
                    <option value="">Ninguno</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="debito">Tarjeta Débito</option>
                    <option value="credito">Tarjeta Crédito</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Pago Online</option>
                    <option value="credito_deuda">Crédito (Deuda)</option>
                  </select>
                </div>
                {formData.metodoPago2.tipo && (
                  <div className="col-md-4">
                    <label className="form-label">Monto</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.metodoPago2.monto}
                      onChange={(e) => handleMetodoPagoChange(2, 'monto', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                )}
                {(formData.metodoPago2.tipo === 'debito' || formData.metodoPago2.tipo === 'credito') && (
                  <div className="col-md-4">
                    <label className="form-label">Número de Voucher</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.metodoPago2.numeroVoucher}
                      onChange={(e) => handleMetodoPagoChange(2, 'numeroVoucher', e.target.value)}
                      required
                    />
                  </div>
                )}
                {formData.metodoPago2.tipo === 'cheque' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label">Número de Cheque</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.metodoPago2.numeroCheque}
                        onChange={(e) => handleMetodoPagoChange(2, 'numeroCheque', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Fecha de Cobro</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.metodoPago2.fechaCobroCheque}
                        onChange={(e) => handleMetodoPagoChange(2, 'fechaCobroCheque', e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                {formData.metodoPago2.tipo === 'credito_deuda' && (
                  <div className="col-md-4">
                    <label className="form-label">Fecha de Pago</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.metodoPago2.fechaPagoCredito}
                      onChange={(e) => handleMetodoPagoChange(2, 'fechaPagoCredito', e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Método para Descontar de Caja */}
              <div className="mb-3">
                <label className="form-label">Método para Descontar de Caja</label>
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
                <small className="text-muted d-block mt-1">
                  Si eliges "No Descontar" la compra quedará registrada pero no se reflejará en el Flujo de Caja.
                </small>
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
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      {(() => {
                        const { subtotal, iva, total } = calcularTotales();
                        return (
                          <>
                            <div className="mb-2">
                              <strong>Subtotal:</strong> ${subtotal.toLocaleString()}
                            </div>
                            <div className="mb-2">
                              <strong>IVA{iva > 0 ? ' (19%)' : ''}:</strong> ${iva.toLocaleString()}
                            </div>
                            <div className="mb-2">
                              <strong>Total:</strong> ${total.toLocaleString()}
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
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check-circle me-2"></i>
                Guardar Compra
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaCompra;