import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { fetchEmpresas, fetchSucursales, fetchClienteByRut, searchClientes } from '../../utils/configApi';
import { API_BASE_URL } from '../../utils/configApi';

// Mapea las claves internas del select a los literales esperados por el backend (ENUM)
const METODO_PAGO_ENUM_MAP = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Tarjeta Debito',
  credito: 'Tarjeta Credito',
  cheque: 'Cheque',
  online: 'Pago Online',
  credito_deuda: 'Credito (Deuda)',
};

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
    observaciones: '',
    fecha_final: '', // nuevo campo para crédito (deuda)
    cuenta_bancaria_id: '' // nueva propiedad para seleccionar cuenta bancaria destino
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
        observaciones: initialData.observaciones || prev.observaciones,
        fecha_final: initialData.fecha_final ? initialData.fecha_final.toString().slice(0,10) : prev.fecha_final
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
  const [clienteSelectValue, setClienteSelectValue] = useState(null);
  const [clienteOptions, setClienteOptions] = useState([]);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [loadingCuentasBancarias, setLoadingCuentasBancarias] = useState(false);

  const toClienteOption = (cli) => {
    if (!cli) return null;
    const id = cli.id ?? cli.ID ?? cli.id_cliente;
    const rut = cli.rut || cli.documento || '';
    const nombre = cli.razon_social || cli.nombre || cli.nombre_fantasia || cli.nombre_completo || '';
    const label = `${rut}${nombre ? ' - ' + nombre : ''}`.trim();
    return { value: id, label, cli };
  };

  // Precargar cliente seleccionado al editar
  useEffect(() => {
    try {
      const cliId = formData.cliente;
      if (!cliId) {
        setClienteSelectValue(null);
        return;
      }
      if (clienteSelectValue && String(clienteSelectValue.value) === String(cliId)) return;

      // Si ya tenemos clienteBuscado, usarlo
      if (clienteBuscado) {
        const opt = toClienteOption(clienteBuscado);
        if (opt) setClienteSelectValue(opt);
        return;
      }

      // Fallback: intentar cargar por rut si está
      if (formData.rut) {
        fetchClienteByRut(formData.rut)
          .then((cli) => {
            if (!cli) return;
            setClienteBuscado(cli);
            const opt = toClienteOption(cli);
            if (opt) setClienteSelectValue(opt);
          })
          .catch(() => null);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cliente]);

  const loadClienteOptions = async (inputValue) => {
    const q = (inputValue || '').trim();
    if (q.length < 2) {
      setClienteOptions([]);
      return;
    }
    setLoadingCliente(true);
    try {
      const res = await searchClientes(q, { limit: 20 });
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      const opts = (list || []).map(toClienteOption).filter(Boolean);
      setClienteOptions(opts);
    } catch {
      setClienteOptions([]);
    } finally {
      setLoadingCliente(false);
    }
  };

  // NUEVO: al editar ventas con cheque, precargar fecha de corte
  useEffect(() => {
    try {
      if (!initialData) return;
      const mp = formData?.metodoPago1?.tipo;
      if (mp !== 'cheque') return;

      const val =
        formData.fecha_cobro_cheque ||
        initialData.fecha_cobro ||
        initialData.fechaCobro ||
        initialData?.cheque?.fecha_cobro ||
        initialData?.cheque?.fechaCobro ||
        null;

      if (val && !formData.fecha_cobro_cheque) {
        setFormData((prev) => ({ ...prev, fecha_cobro_cheque: String(val).slice(0, 10) }));
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, formData?.metodoPago1?.tipo]);

  // Si existe una cuenta bancaria asociada a la sucursal seleccionada, seleccionar automáticamente
  React.useEffect(() => {
    try {
      const sucId = formData.sucursal;
      if (!sucId || !cuentasBancarias || cuentasBancarias.length === 0) return;
      // Si el usuario ya seleccionó explícitamente una cuenta, no sobrescribir
      if (formData.cuenta_bancaria_id) return;
      // Buscar cuenta que coincida con la sucursal (varios nombres de campo posibles)
      const match = cuentasBancarias.find(c => String(c.id_sucursal ?? c.cuenta_id_sucursal ?? c.sucursal_id ?? c.sucursal ?? c.idSucursal ?? '') === String(sucId) || String(c.sucursal_nombre ?? c.nombre ?? c.bank ?? '') === String(sucId));
      if (match) {
        setFormData(prev => ({ ...prev, cuenta_bancaria_id: match.id }));
        console.debug('[NuevaVenta] cuenta bancaria auto-seleccionada para sucursal', sucId, '=>', match.id);
      }
    } catch (e) {
      console.warn('Error al auto-seleccionar cuenta bancaria:', e);
    }
  }, [formData.sucursal, cuentasBancarias]);

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

    // Cargar cuentas bancarias opcionalmente para permitir seleccionar destino de pagos bancarios
    (async () => {
      setLoadingCuentasBancarias(true);
      try {
        const r = await fetch(`${API_BASE_URL}/banco/cuentas`, { credentials: 'include' });
        const json = await r.json().catch(() => null);
        const cuentasList = Array.isArray(json) ? json : (json?.data ?? json?.cuentas ?? []);
        if (mounted) setCuentasBancarias(cuentasList || []);
      } catch (e) {
        console.warn('No se pudieron cargar cuentas bancarias:', e.message || e);
        if (mounted) setCuentasBancarias([]);
      } finally { if (mounted) setLoadingCuentasBancarias(false); }
    })();
    
    return () => { mounted = false; };
  }, []);

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

  // Formatear fecha a DD/MM/YYYY para mostrar en la UI
  const formatDate = (val) => {
    const d = parseDate(val);
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // --------------------------------------------------
  // Totales: comportamiento similar a Compras
  // Si el documento es afecto a IVA, el precio unitario se considera CON IVA
  // y calculamos subtotal = totalConIva / 1.19, iva = totalConIva - subtotal
  const DOCUMENTOS_AFECTOS_IVA = ['factura_afecta', 'boleta_afecta', 'voucher_credito', 'voucher_debito'];

  const calcularTotales = () => {
    const totalConIva = (formData.items || []).reduce((s, item) => {
      const cantidad = Number(item.cantidad || 0);
      const precio = Number(item.precioUnitario || 0);
      return s + (cantidad * precio);
    }, 0);

    const esAfecto = DOCUMENTOS_AFECTOS_IVA.includes(formData.documentoVenta);
    if (esAfecto) {
      const subtotal = Math.round(totalConIva / 1.19);
      const iva = totalConIva - subtotal;
      return { subtotal, iva, total: totalConIva, esAfecto };
    }

    return { subtotal: totalConIva, iva: 0, total: totalConIva, esAfecto };
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
    const { subtotal, iva, total } = calcularTotales();

    const metodoPagoLiteral =
      formData.metodoPago1 && formData.metodoPago1.tipo
        ? (METODO_PAGO_ENUM_MAP[String(formData.metodoPago1.tipo)] || null)
        : null;

    // Validar que la suma del método de pago sea igual al total (solo uno o combinación de dos métodos)
    const totalPagos = Number(formData.metodoPago1.monto || 0) + Number(formData.metodoPago2.monto || 0);
    if (Math.round(totalPagos * 100) !== Math.round(total * 100)) {
      alert('La suma de los métodos de pago debe ser igual al total de la venta');
      return;
    }

    // Normalizar fecha_final a YYYY-MM-DD si existe
    const normalizeFechaFinal = (val) => {
      if (!val && val !== 0) return null;
      const s = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // ya ISO
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`; // DD/MM/YYYY -> YYYY-MM-DD
      const d = new Date(s);
      if (!isNaN(d)) return d.toISOString().slice(0,10);
      return null;
    };

    const fechaFinalNormalizada = normalizeFechaFinal(formData.fecha_final);
    if (formData.metodoPago1.tipo === 'credito_deuda') {
      if (!fechaFinalNormalizada) {
        alert('Ingrese una fecha final válida para la deuda (formato YYYY-MM-DD)');
        return;
      }
    }

    const ventaData = {
      fecha: (formData.fecha || '').toString().slice(0,10),
      sucursal_id: formData.sucursal ? Number(formData.sucursal) : null,
      cliente_id: formData.cliente ? Number(formData.cliente) : null,
      documentoVenta: formData.documentoVenta || null,
      folioVenta: formData.folioVenta || null,
      subtotal: subtotal,
      iva: iva,
      total: total,
      // Enviar el literal esperado por el backend (compatibilidad: `metodo_pago`)
      metodo_pago: metodoPagoLiteral,
      // Detalle (legacy) de métodos de pago si aplica
      metodos_pago_detalle: formData.metodosPagoDetalle || null,
      // Enviar metodos_pago como arreglo para que el backend pueda generar movimientos bancarios automáticamente
      metodos_pago: (function(){
        const arr = [];
        if (formData.metodoPago1 && formData.metodoPago1.tipo) {
          const mp1 = { tipo: formData.metodoPago1.tipo, monto: Number(formData.metodoPago1.monto || 0) };
          // NUEVO: para cheque, permitir enviar fecha de cobro desde ventas
          if (formData.metodoPago1.tipo === 'cheque' && formData.fecha_cobro_cheque) {
            mp1.fecha_cobro = formData.fecha_cobro_cheque;
          }
          arr.push(mp1);
        }
        if (formData.metodoPago2 && formData.metodoPago2.tipo) arr.push({ tipo: formData.metodoPago2.tipo, monto: Number(formData.metodoPago2.monto || 0) });
        return arr.length ? arr : null;
      })(),
      // NUEVO: enviar fecha_cobro al backend (para que al crear cheque desde venta lo guarde)
      ...(formData.metodoPago1?.tipo === 'cheque' && formData.fecha_cobro_cheque ? { fecha_cobro: formData.fecha_cobro_cheque } : {}),
      // Si se seleccionó cuenta bancaria en el formulario y hay un método bancario, enviar cuenta_id
      ...( (function(){
        const bankTypes = ['transferencia','debito','credito','online','transbank'];
        const hasBank = ((formData.metodoPago1 && bankTypes.includes(String(formData.metodoPago1.tipo))) || (formData.metodoPago2 && bankTypes.includes(String(formData.metodoPago2.tipo))));
        if (!hasBank) return {};
        // Priorizar cuenta seleccionada; si no existe buscar una asociada a la sucursal
        let cuentaId = formData.cuenta_bancaria_id;
        if (!cuentaId) {
          const sucId = formData.sucursal;
          if (sucId && cuentasBancarias && cuentasBancarias.length > 0) {
            const match = cuentasBancarias.find(c => String(c.id_sucursal ?? c.cuenta_id_sucursal ?? c.sucursal_id ?? c.sucursal ?? c.idSucursal ?? '') === String(sucId));
            if (match) cuentaId = match.id;
          }
        }
        if (cuentaId) return { cuenta_id: Number(cuentaId) };
        return {};
      })()),
      observaciones: formData.observaciones || null,
      estado: 'REGISTRADA',
      detalles: detalles.map(d => ({
        descripcion: String(d.descripcion || ''),
        cantidad: Number(d.cantidad) || 0,
        precio_unitario: Number(d.precio_unitario) || 0,
        total_linea: Number(d.total_linea) || 0,
      })),
      // Incluir fecha_final sólo si el método es Crédito (Deuda)
      ...(metodoPagoLiteral === 'Credito (Deuda)' ? { fecha_final: fechaFinalNormalizada } : {})
    };

    // Si el método es bancario mostrar selector de cuenta en el formulario: insertar campo en el modal
    // (se renderiza más abajo en renderCamposMetodoPago)
    
    // debug: mostrar payload antes de enviar para detectar NaN/objetos inesperados
    console.debug('[NuevaVenta] ventaData ->', ventaData);

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

        {/* Nota: el selector de cuenta bancaria se oculta en UI. La cuenta se selecciona automáticamente por sucursal si existe. */}

        {/* Campo condicional fecha_final para Crédito (Deuda) */}
        {metodoPago.tipo === 'credito_deuda' && (
          <div className="col-md-4">
            <label className="form-label">Fecha final (vencimiento)</label>
            <input
              type="date"
              className="form-control"
              value={formData.fecha_final || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_final: e.target.value }))}
            />
          </div>
        )}

        {/* NUEVO: Campo condicional fecha de cobro (fecha de corte) para Cheque */}
        {metodoPago.tipo === 'cheque' && (
          <div className="col-md-4">
            <label className="form-label">Fecha de Cobro</label>
            <input
              type="date"
              className="form-control"
              value={formData.fecha_cobro_cheque || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_cobro_cheque: e.target.value }))}
              placeholder="Fecha de cobro"
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

              {/* REEMPLAZO: selector tipo Select2 */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Cliente</label>
                  <Select
                    value={clienteSelectValue}
                    onInputChange={(val) => {
                      loadClienteOptions(val);
                    }}
                    onChange={(opt) => {
                      setClienteSelectValue(opt);
                      if (!opt) {
                        setClienteBuscado(null);
                        setFormData((prev) => ({ ...prev, cliente: null, rut: '' }));
                        return;
                      }
                      const cli = opt.cli;
                      setClienteBuscado(cli);
                      setFormData((prev) => ({
                        ...prev,
                        cliente: opt.value,
                        rut: (cli?.rut || cli?.documento || '').toString(),
                      }));
                    }}
                    options={clienteOptions}
                    isClearable
                    isLoading={loadingCliente}
                    placeholder="Buscar por RUT o Razón Social..."
                    noOptionsMessage={() => 'Sin resultados'}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    menuPortalTarget={document.body}
                  />
                  <small className="text-muted">Escriba y aparecerán clientes de inmediato.</small>
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
                      {/* Mostrar si el precio unitario se considera con o sin IVA según el documento */}
                      <label className="form-label">{DOCUMENTOS_AFECTOS_IVA.includes(formData.documentoVenta) ? 'Precio Unitario (con IVA)' : 'Precio Unitario (sin IVA)'}</label>
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
                        <strong>Subtotal:</strong> ${calcularTotales().subtotal.toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <strong>IVA (19%):</strong> ${calcularTotales().iva.toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <strong>Total:</strong> ${calcularTotales().total.toLocaleString()}
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