import React, { useState } from 'react';

function NuevaVenta({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    sucursal: '',
    rut: '',
    cliente: null,
    documentoVenta: '',
    folioVenta: '',
    items: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }],
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
    incluirFlujoCaja: true,
    observaciones: ''
  });

  const [clienteBuscado, setClienteBuscado] = useState(null);

  const handleBuscarCliente = async () => {
    if (formData.rut) {
      setClienteBuscado({
        rut: formData.rut,
        nombre: 'Empresa de Ejemplo SpA',
        direccion: 'Av. Principal 123',
        telefono: '+56 2 2345 6789'
      });
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { descripcion: '', cantidad: 1, precioUnitario: 0 }]
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

  const calcularSubtotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.cantidad * item.precioUnitario);
    }, 0);
  };

  const calcularIVA = (subtotal) => {
    return subtotal * 0.19; // IVA Chile: 19%
  };

  const registrarMovimientoEfectivo = async (movimiento) => {
    try {
      // Aquí irá la lógica para guardar el movimiento en la base de datos
      console.log('Registrando movimiento en efectivo:', movimiento);
    } catch (error) {
      console.error('Error al registrar movimiento en efectivo:', error);
      alert('Error al registrar el movimiento en efectivo');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subtotal = calcularSubtotal();
    const iva = calcularIVA(subtotal);
    const total = subtotal + iva;

    // Validar que la suma de los montos de pago sea igual al total
    const totalPagos = formData.metodoPago1.monto + (formData.metodoPago2.tipo ? formData.metodoPago2.monto : 0);
    if (totalPagos !== total) {
      alert('La suma de los montos de pago debe ser igual al total de la venta');
      return;
    }

    const ventaData = {
      ...formData,
      subtotal,
      iva,
      total,
      estado: 'pendiente'
    };

    // Si hay pago en efectivo y está marcado para incluir en flujo de caja,
    // registrar el movimiento en efectivo
    if (formData.incluirFlujoCaja) {
      if (formData.metodoPago1.tipo === 'efectivo') {
        registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: formData.metodoPago1.monto,
          detalle: `Venta en efectivo - ${formData.documentoVenta} ${formData.folioVenta}`,
          tipo: 'ingreso',
          categoria: 'Venta',
          sucursal: formData.sucursal
        });
      }
      if (formData.metodoPago2.tipo === 'efectivo') {
        registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: formData.metodoPago2.monto,
          detalle: `Venta en efectivo - ${formData.documentoVenta} ${formData.folioVenta}`,
          tipo: 'ingreso',
          categoria: 'Venta',
          sucursal: formData.sucursal
        });
      }
    }

    onSave(ventaData);
    onClose();
  };

  const renderCamposMetodoPago = (metodoPagoNum) => {
    const metodoPago = formData[`metodoPago${metodoPagoNum}`];
    
    return (
      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">
            {metodoPagoNum === 1 ? 'Primer Método de Pago' : 'Segundo Método de Pago'}
          </label>
          <select 
            className="form-select"
            value={metodoPago.tipo}
            onChange={(e) => handleMetodoPagoChange(metodoPagoNum, 'tipo', e.target.value)}
            required={metodoPagoNum === 1}
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

        {metodoPago.tipo && (
          <div className="col-md-4">
            <label className="form-label">Monto</label>
            <input
              type="number"
              className="form-control"
              value={metodoPago.monto}
              onChange={(e) => handleMetodoPagoChange(metodoPagoNum, 'monto', parseFloat(e.target.value))}
              required
            />
          </div>
        )}

        {(metodoPago.tipo === 'debito' || metodoPago.tipo === 'credito') && (
          <div className="col-md-4">
            <label className="form-label">Número de Voucher</label>
            <input
              type="text"
              className="form-control"
              value={metodoPago.numeroVoucher}
              onChange={(e) => handleMetodoPagoChange(metodoPagoNum, 'numeroVoucher', e.target.value)}
              required
            />
          </div>
        )}

        {metodoPago.tipo === 'cheque' && (
          <>
            <div className="col-md-4">
              <label className="form-label">Número de Cheque</label>
              <input
                type="text"
                className="form-control"
                value={metodoPago.numeroCheque}
                onChange={(e) => handleMetodoPagoChange(metodoPagoNum, 'numeroCheque', e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha de Cobro</label>
              <input
                type="date"
                className="form-control"
                value={metodoPago.fechaCobroCheque}
                onChange={(e) => handleMetodoPagoChange(metodoPagoNum, 'fechaCobroCheque', e.target.value)}
                required
              />
            </div>
          </>
        )}

        {metodoPago.tipo === 'credito_deuda' && (
          <div className="col-md-4">
            <label className="form-label">Fecha de Pago</label>
            <input
              type="date"
              className="form-control"
              value={metodoPago.fechaPagoCredito}
              onChange={(e) => handleMetodoPagoChange(metodoPagoNum, 'fechaPagoCredito', e.target.value)}
              required
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Nueva Venta</h5>
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
                  <label className="form-label">Documento de Venta</label>
                  <select
                    className="form-select"
                    value={formData.documentoVenta}
                    onChange={(e) => setFormData({...formData, documentoVenta: e.target.value})}
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
                  <label className="form-label">Folio de Venta</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.folioVenta}
                    onChange={(e) => setFormData({...formData, folioVenta: e.target.value})}
                    required={formData.documentoVenta !== 'sin_documento'}
                    placeholder="Ingrese N° de folio"
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">RUT Cliente</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ingrese RUT del cliente"
                      value={formData.rut}
                      onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleBuscarCliente}
                    >
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {clienteBuscado && (
                <div className="alert alert-info mb-3">
                  <h6 className="mb-1">Cliente encontrado:</h6>
                  <p className="mb-0">
                    <strong>Nombre:</strong> {clienteBuscado.nombre}<br />
                    <strong>RUT:</strong> {clienteBuscado.rut}<br />
                    <strong>Dirección:</strong> {clienteBuscado.direccion}
                  </p>
                </div>
              )}

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6>Detalle de Venta</h6>
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
                      <label className="form-label">Precio Unitario</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={item.precioUnitario}
                        onChange={(e) => handleItemChange(index, 'precioUnitario', parseFloat(e.target.value))}
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

              {/* Métodos de Pago */}
              {renderCamposMetodoPago(1)}
              {renderCamposMetodoPago(2)}

              {/* Opción Incluir en Flujo de Caja */}
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
                <small className="text-muted d-block mt-1">
                  Si no incluyes en el flujo de caja esta Venta quedará ingresada pero no se sumará en tus movimientos de Ingresos ni aparecerá en el flujo de caja de la empresa.
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
                      <div className="mb-2">
                        <strong>Subtotal:</strong> ${calcularSubtotal().toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <strong>IVA (19%):</strong> ${calcularIVA(calcularSubtotal()).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <strong>Total:</strong> ${(calcularSubtotal() + calcularIVA(calcularSubtotal())).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                <i className="bi bi-check-circle me-2"></i>
                Guardar Venta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaVenta;