import React, { useState, useEffect } from 'react';
import { fetchPublicSucursales, fetchClienteByRut } from '../../utils/configApi';

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
  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchPublicSucursales()
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setSucursales(list || []);
      })
      .catch(err => {
        console.error('Error cargando sucursales (public):', err);
        setSucursales([]);
      });
    return () => { mounted = false; };
  }, []);

  const handleBuscarCliente = async () => {
    if (!formData.rut) return alert('Ingrese RUT para buscar');
    try {
      const cliente = await fetchClienteByRut(formData.rut);
      if (!cliente) {
        setClienteBuscado(null);
        return alert('Cliente no encontrado');
      }
      setClienteBuscado(cliente);
      // Asegurar que `formData.cliente` sea siempre el id numérico del cliente
      let clienteId = null;
      if (typeof cliente === 'number') {
        clienteId = cliente;
      } else if (typeof cliente === 'string' && /^\d+$/.test(cliente)) {
        clienteId = Number(cliente);
      } else if (cliente && typeof cliente === 'object') {
        clienteId = cliente.id ?? cliente.ID ?? cliente.id_cliente ?? null;
        if (clienteId !== null) clienteId = Number(clienteId);
      }
      setFormData(prev => ({ ...prev, cliente: clienteId }));
    } catch (err) {
      console.error('Error buscando cliente', err);
      alert('Error al buscar cliente');
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
      return total + ((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0));
    }, 0);
  };

  const calcularIVA = (subtotal) => {
    return subtotal * 0.19;
  };

  const registrarMovimientoEfectivo = async (movimiento) => {
    try {
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

    // Validar que el monto del método de pago sea igual al total
    const totalPagos = Number(formData.metodoPago1.monto || 0);
    if (totalPagos !== total) {
      alert('El monto del método de pago debe ser igual al total de la venta');
      return;
    }

    // Transformar a formato esperado por el backend
    const detalles = formData.items.map(item => ({
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad) || 0,
      precio_unitario: Number(item.precioUnitario) || 0,
      total_linea: (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0),
    }));

    const ventaData = {
      fecha: formData.fecha,
      sucursal_id: formData.sucursal ? Number(formData.sucursal) : null,
      cliente_id: formData.cliente ? Number(formData.cliente) : null,
      documentoVenta: formData.documentoVenta || null,
      folioVenta: formData.folioVenta || null,
      subtotal,
      iva,
      total,
      // Enviamos literal que coincide con el enum de la columna `ventas.metodos_pago`
      metodos_pago: formData.metodoPago1.tipo || null,
      observaciones: formData.observaciones || null,
      estado: 'REGISTRADA',
      detalles,
    };

    // Si hay pago en efectivo y está marcado para incluir en flujo de caja,
    // registrar el movimiento en efectivo
    if (formData.incluirFlujoCaja) {
      if (formData.metodoPago1.tipo === 'Efectivo') {
        registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: formData.metodoPago1.monto,
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
          <label className="form-label">Método de Pago</label>
          <select 
            className="form-select"
            value={metodoPago.tipo}
            onChange={(e) => handleMetodoPagoChange(metodoPagoNum, 'tipo', e.target.value)}
            required
          >
            <option value="">Seleccionar método</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarejeta Debito">Tarjeta Débito</option>
            <option value="Tarjeta Credito">Tarjeta Crédito</option>
            <option value="Cheque">Cheque</option>
            <option value="Pago Online">Pago Online</option>
            <option value="Credito (Deuda)">Credito (Deuda)</option>
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

        {/* No mostramos campos extra (voucher/cheque/fechas) según petición del usuario */}
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
                    {sucursales.map((s) => (
                      <option key={s.id ?? s.ID ?? s.id_sucursal} value={s.id ?? s.ID ?? s.id_sucursal}>
                        {s.nombre ?? s.name ?? s.nombre_sucursal ?? s.nombre}
                      </option>
                    ))}
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
                <div className="alert alert-info mb-3 d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1"><strong>Nombre:</strong> {clienteBuscado.razon_social || clienteBuscado.nombre || clienteBuscado.nombre_fantasia || clienteBuscado.nombre_completo || ''}</p>
                    <p className="mb-0"><strong>RUT:</strong> {clienteBuscado.rut || clienteBuscado.documento || ''}</p>
                    {clienteBuscado.direccion && (<p className="mb-0"><strong>Dirección:</strong> {clienteBuscado.direccion}</p>)}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => { setClienteBuscado(null); setFormData(prev => ({ ...prev, cliente: null, rut: '' })); }}
                    >
                      Quitar
                    </button>
                  </div>
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