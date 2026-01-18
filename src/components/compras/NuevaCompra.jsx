import React, { useMemo, useState, useEffect } from 'react';

function NuevaCompra({ onClose, onSave, proveedores = [], sucursales = [], initialData = null }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    sucursal: '',
    documentoCompra: '',
    folioCompra: '',
    proveedor: '',
    proveedor_id: '',
    items: [{ descripcion: '', cantidad: 1, valor: 0 }],
    metodoPago1: {
      tipo: 'efectivo',
      monto: 0,
    },
    observaciones: '',
    fecha_final: '' // nuevo campo para fecha de vencimiento si es crédito deuda
  });

  const sucursalOptions = useMemo(() => {
    if (Array.isArray(sucursales) && sucursales.length > 0) return sucursales;
    return [
      { id: 'central', nombre: 'Sucursal Central' },
      { id: 'norte', nombre: 'Sucursal Norte' },
      { id: 'sur', nombre: 'Sucursal Sur' },
    ];
  }, [sucursales]);

  // Precargar datos si se edita una compra
  useEffect(() => {
    if (!initialData) return;
    console.debug('[NuevaCompra] precargando initialData:', initialData);
    try {
      const detallesRaw = Array.isArray(initialData.detalles)
        ? initialData.detalles
        : Array.isArray(initialData.detalles?.data)
        ? initialData.detalles.data
        : initialData.items || [];

      const items = detallesRaw.map(d => ({
        descripcion: d.descripcion_item ?? d.descripcion ?? d.nombre ?? '',
        cantidad: Number(d.cantidad ?? d.cant ?? 1),
        valor: Number(d.costo_unitario ?? d.precio_unitario ?? d.valor ?? 0),
      }));

      setFormData(prev => ({
        ...prev,
        fecha: (initialData.fecha || prev.fecha).toString().slice(0,10),
        sucursal: initialData.sucursal_id ?? initialData.id_sucursal ?? (initialData.sucursal && (initialData.sucursal.id ?? initialData.sucursal.ID)) ?? prev.sucursal,
        documentoCompra: initialData.tipo_documento ?? initialData.documentoCompra ?? prev.documentoCompra,
        folioCompra: initialData.folio ?? initialData.numero_documento ?? prev.folioCompra,
        proveedor_id: initialData.proveedor_id ?? (initialData.proveedor && (initialData.proveedor.id ?? initialData.proveedor.ID)) ?? prev.proveedor_id,
        proveedor: initialData.proveedor?.razon_social ?? initialData.proveedor?.nombre_comercial ?? prev.proveedor,
        items: items.length ? items : prev.items,
        metodoPago1: initialData.metodoPago1 ?? prev.metodoPago1,
        observaciones: initialData.observaciones ?? prev.observaciones,
        fecha_final: initialData.fecha_final ? initialData.fecha_final.toString().slice(0,10) : prev.fecha_final,
      }));
    } catch (e) {
      console.error('Error precargando initialData en NuevaCompra', e);
    }
  }, [initialData]);

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

  const handleMetodoPagoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      metodoPago1: {
        ...prev.metodoPago1,
        [field]: value
      }
    }));
  };

  const calcularTotales = () => {
    const total = formData.items.reduce((total, item) => {
      return total + (item.cantidad * item.valor);
    }, 0);

    const documentosAfectosIVA = [
      'factura_afecta',
      'boleta_afecta',
      'voucher_credito',
      'voucher_debito'
    ];
    const esAfectoIVA = documentosAfectosIVA.includes(formData.documentoCompra);

    if (esAfectoIVA) {
      const subtotal = Math.round(total / 1.19);
      const iva = total - subtotal;
      return { subtotal, iva, total };
    }

    return { subtotal: total, iva: 0, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subtotal, iva, total } = calcularTotales();

    const montoPago = Number(formData.metodoPago1.monto || 0);
    if (montoPago !== total) {
      alert('El monto del pago debe ser igual al total de la compra');
      return;
    }

    // Si el método seleccionado es Crédito (Deuda) requerir fecha_final
    if (formData.metodoPago1.tipo === 'credito_deuda') {
      if (!formData.fecha_final) {
        alert('Ingrese la fecha final (vencimiento) para la compra a crédito');
        return;
      }
    }

    const compraData = {
      ...formData,
      subtotal,
      iva,
      total,
      estado: 'pagada'
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
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Sucursal</label>
                  <select
                    className="form-select"
                    value={formData.sucursal}
                    onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar sucursal</option>
                    {sucursalOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Documento de Compra</label>
                  <select
                    className="form-select"
                    value={formData.documentoCompra}
                    onChange={(e) => setFormData({ ...formData, documentoCompra: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, folioCompra: e.target.value })}
                    required={formData.documentoCompra !== 'sin_documento'}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Proveedor</label>
                  {Array.isArray(proveedores) && proveedores.length > 0 ? (
                    <select
                      className="form-select"
                      value={formData.proveedor_id}
                      onChange={(e) => {
                        const proveedor_id = e.target.value;
                        const p = proveedores.find((x) => String(x.id) === String(proveedor_id));
                        setFormData({
                          ...formData,
                          proveedor_id,
                          proveedor: p?.razon_social || p?.nombre_comercial || p?.rut || '',
                        });
                      }}
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.razon_social || p.nombre_comercial || p.rut}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Proveedor"
                      value={formData.proveedor}
                      onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                      required
                    />
                  )}
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
                        onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value))}
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

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Método de Pago</label>
                  <select
                    className="form-select"
                    value={formData.metodoPago1.tipo}
                    onChange={(e) => handleMetodoPagoChange('tipo', e.target.value)}
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
                    onChange={(e) => handleMetodoPagoChange('monto', parseFloat(e.target.value))}
                    required
                  />
                </div>
                {/* Campo condicional fecha_final para Crédito (Deuda) */}
                {formData.metodoPago1.tipo === 'credito_deuda' && (
                  <div className="col-md-4">
                    <label className="form-label">Fecha final (vencimiento)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.fecha_final || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_final: e.target.value }))}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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