import React, { useState, useEffect } from 'react';
import { fetchEmpresas, fetchSucursales, fetchClienteByRut } from '../../utils/configApi';

function NuevaVenta({ onClose, onSave, initialData }) {
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
      monto: ''
    },
    metodoPago2: {
      tipo: '',
      monto: ''
    },
    incluirFlujoCaja: true,
    observaciones: ''
  });

  // Cuando se pasa initialData precargar el formulario para edición
  useEffect(() => {
    if (!initialData) return;
    try {
      const detalles = Array.isArray(initialData.detalles)
        ? initialData.detalles.map(d => ({
            descripcion: d.descripcion || d.nombre || '',
            cantidad: Number(d.cantidad || d.cant || 1),
            precioUnitario: Number(d.precio_unitario || d.precio || d.precioUnitario || 0)
          }))
        : formData.items;

      // helper: normalizar literales recibidos a las claves del select
      const normalizeMetodoTipo = (t) => {
        if (!t) return '';
        const s = String(t).toLowerCase();
        if (s.includes('efect')) return 'efectivo';
        if (s.includes('transfer')) return 'transferencia';
        if (s.includes('debito')) return 'debito';
        if (s.includes('credito') || s.includes('card') || s.includes('credit')) return 'credito';
        if (s.includes('cheque') || s.includes('check')) return 'cheque';
        if (s.includes('online') || s.includes('webpay')) return 'online';
        if (s.includes('deuda')) return 'credito_deuda';
        return s.replace(/\s+/g,'_');
      };

      const parseMetodo = (mp) => {
        if (!mp) return { tipo: '', monto: 0 };
        if (Array.isArray(mp)) {
          const m = mp[0] || mp;
          const tipoRaw = m.tipo || m.metodo || (typeof m === 'string' ? m : '');
          const monto = Number(m.monto || m.valor || 0) || 0;
          return { tipo: normalizeMetodoTipo(tipoRaw), monto };
        }
        if (typeof mp === 'object') {
          const tipoRaw = mp.tipo || mp.metodo || '';
          return { tipo: normalizeMetodoTipo(tipoRaw), monto: Number(mp.monto || mp.valor || 0) || 0 };
        }
        // si viene string intentar parsear JSON, si no usar string literal
        if (typeof mp === 'string') {
          try {
            const parsed = JSON.parse(mp);
            return parseMetodo(parsed);
          } catch (e) {
            return { tipo: normalizeMetodoTipo(mp), monto: 0 };
          }
        }
        return { tipo: normalizeMetodoTipo(mp), monto: 0 };
      };

      // Determinar valor de metodos_pago desde varias fuentes posibles en initialData
      let metodosRaw = initialData.metodos_pago ?? null;
      // campo auxiliar que a veces existió
      if ((!metodosRaw || metodosRaw === '') && (initialData.metodos_pago_monto || initialData.metodos_pago_monto === 0)) {
        // si solo existe monto pero no tipo, no hacemos nada adicional aquí
      }
      // si hay relación `metodosPago` con columna 'metodos' (json string), usarla
      if (!metodosRaw && initialData.metodosPago && initialData.metodosPago.metodos) {
        try { metodosRaw = JSON.parse(initialData.metodosPago.metodos); } catch (e) { metodosRaw = initialData.metodosPago.metodos; }
      }

      // si viene una columna adicional con monto separado, intentar usarla
      const metodosMonto = initialData.metodos_pago_monto ?? (initialData.metodosPago && (initialData.metodosPago.monto ?? null));

      setFormData(prev => ({
        ...prev,
        fecha: (initialData.fecha || prev.fecha).toString().slice(0,10),
        sucursal: initialData.sucursal_id || initialData.sucursal || prev.sucursal,
        cliente: initialData.cliente_id || initialData.cliente || prev.cliente,
        documentoVenta: initialData.documentoVenta || initialData.documento || prev.documentoVenta,
        folioVenta: initialData.folioVenta || initialData.folio || prev.folioVenta,
        items: detalles,
        metodoPago1: (function(){
          const mpCandidate = metodosRaw ?? (initialData.metodos_pago_1 ?? null);
          const parsed = parseMetodo(mpCandidate);
          // si hay monto separado en otra propiedad y parsed.monto es 0, usarlo
          if ((parsed.monto === 0 || isNaN(parsed.monto)) && (metodosMonto !== undefined && metodosMonto !== null)) {
            return { tipo: parsed.tipo || '', monto: Number(metodosMonto) || 0 };
          }
          return parsed;
        })(),
        incluirFlujoCaja: prev.incluirFlujoCaja,
        observaciones: initialData.observaciones || prev.observaciones
      }));

      // Si initialData contiene cliente_id (o cliente), intentar cargar datos del cliente para mostrar en el formulario
      (async () => {
        try {
          const clienteId = initialData.cliente_id ?? (initialData.cliente && (initialData.cliente.id || initialData.cliente.ID)) ?? null;
          if (clienteId) {
            try {
              const cli = await fetchClienteByRut(String(clienteId));
              if (cli) {
                setClienteBuscado(cli);
                setFormData(prev => ({ ...prev, rut: cli.rut || cli.documento || cli.RUT || prev.rut, cliente: cli.id ?? cli.ID ?? clienteId }));
              }
            } catch (e) {
              // si no se encuentra por id, ignorar (no romper edición)
              console.warn('No se pudo obtener cliente por id al precargar edición:', e.message || e);
            }
          } else if (initialData.cliente && typeof initialData.cliente === 'object') {
            // si viene objeto cliente en initialData
            const cliObj = initialData.cliente;
            setClienteBuscado(cliObj);
            setFormData(prev => ({ ...prev, rut: cliObj.rut || cliObj.documento || cliObj.RUT || prev.rut, cliente: cliObj.id ?? cliObj.ID ?? prev.cliente }));
          }
        } catch (e) {
          console.warn('Error precargando cliente en edición:', e.message || e);
        }
      })();

    } catch (e) {
      console.error('Error al precargar initialData en NuevaVenta', e);
    }
  }, [initialData]);

  const [clienteBuscado, setClienteBuscado] = useState(null);
  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const empresasRes = await fetchEmpresas();
        const empresa = Array.isArray(empresasRes) ? empresasRes[0] : (empresasRes?.data ? empresasRes.data[0] : null);
        if (!empresa) {
          if (mounted) setSucursales([]);
          return;
        }
        const sucursalesRes = await fetchSucursales(empresa.id);
        if (!mounted) return;
        const list = Array.isArray(sucursalesRes) ? sucursalesRes : (sucursalesRes?.data ?? []);
        setSucursales(list || []);
      } catch (err) {
        console.error('Error cargando sucursales:', err);
        if (mounted) setSucursales([]);
      }
    })();
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
      setFormData(prev => ({ ...prev, cliente: cliente.id ?? cliente.ID ?? cliente.id_cliente ?? cliente }));
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
    // convertir valores numéricos de forma segura
    if (field === 'cantidad') newItems[index][field] = Number(value || 0);
    else if (field === 'precioUnitario') newItems[index][field] = Number(value || 0);
    else newItems[index][field] = value;
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
      const cantidad = Number(item.cantidad || 0);
      const precio = Number(item.precioUnitario || 0);
      return total + (cantidad * precio);
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

    // Transformar a formato esperado por el backend
    const detalles = formData.items.map(item => ({
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad) || 0,
      precio_unitario: Number(item.precioUnitario) || 0,
      total_linea: (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0),
    }));

    // Sanitizar y asegurar números (evitar NaN)
    const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
    const subtotalClean = round2(detalles.reduce((s, d) => s + (Number(d.total_linea) || 0), 0));
    const ivaClean = round2(calcularIVA(subtotalClean));
    const totalClean = round2(subtotalClean + ivaClean);

    const ventaData = {
      fecha: (formData.fecha || '').toString().slice(0,10),
      sucursal_id: formData.sucursal ? Number(formData.sucursal) : null,
      cliente_id: formData.cliente ? Number(formData.cliente) : null,
      documentoVenta: formData.documentoVenta || null,
      folioVenta: formData.folioVenta || null,
      subtotal: subtotalClean,
      iva: ivaClean,
      total: totalClean,
      // En el backend `metodos_pago` es una columna ENUM/string. Enviar solo el tipo (string) o null
      metodos_pago: (formData.metodoPago1 && formData.metodoPago1.tipo) ? String(formData.metodoPago1.tipo) : null,
      observaciones: formData.observaciones || null,
      estado: 'REGISTRADA',
      detalles: detalles.map(d => ({
        descripcion: String(d.descripcion || ''),
        cantidad: Number(d.cantidad) || 0,
        precio_unitario: Number(d.precio_unitario) || 0,
        total_linea: Number(d.total_linea) || 0,
      })),
    };

    // debug: mostrar payload antes de enviar para detectar NaN/objetos inesperados
    console.debug('[NuevaVenta] ventaData ->', ventaData);

    // Validar que la suma del método de pago sea igual al total (solo un método)
    const totalPagos = Number(formData.metodoPago1.monto || 0);
    if (Math.round(totalPagos * 100) !== Math.round(totalClean * 100)) {
      alert('El monto del método de pago debe ser igual al total de la venta');
      return;
    }

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

  const renderCamposMetodoPago = () => {
    const metodoPago = formData.metodoPago1;
    return (
      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Método de pago</label>
          <select 
            className="form-select"
            value={metodoPago.tipo}
            onChange={(e) => setFormData(prev => ({ ...prev, metodoPago1: { ...prev.metodoPago1, tipo: e.target.value } }))}
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
            value={metodoPago.monto ?? ''}
            onChange={(e) => setFormData(prev => ({ ...prev, metodoPago1: { ...prev.metodoPago1, monto: e.target.value } }))}
            required
          />
        </div>
      </div>
    );
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className={`modal-header ${initialData ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
            <h5 className="modal-title">{initialData ? 'Editar Venta' : 'Nueva Venta'}</h5>
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
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
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
                        onChange={(e) => handleItemChange(index, 'precioUnitario', e.target.value)}
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

              {/* Método de pago único */}
              {renderCamposMetodoPago()}

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
                Cerrar
              </button>
              <button type="submit" className={`btn ${initialData ? 'btn-warning' : 'btn-primary'}`}>
                <i className={`bi ${initialData ? 'bi-save' : 'bi-check2-circle'} me-2`}></i>
                {initialData ? 'Guardar cambios' : (
                  <>
                    <i className="bi bi-printer me-2"></i>
                    Registrar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaVenta;