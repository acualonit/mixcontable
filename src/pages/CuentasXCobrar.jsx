import React, { useState } from 'react';
import DetalleCuentaCobrar from '../components/cuentas/DetalleCuentaCobrar';
import PagoCuentaCobrar from '../components/cuentas/PagoCuentaCobrar';
import HistorialPagos from '../components/cuentas/HistorialPagos';
import CuentasCobrarEliminadas from '../components/cuentas/CuentasCobrarEliminadas';
import { exportToExcel } from '../utils/exportUtils';
import ventasApi from '../utils/ventasApi';
import { API_BASE_URL } from '../utils/configApi';

function CuentasXCobrar() {
  const [filtros, setFiltros] = useState({
    fecha: '',
    cliente: '',
    documento: '',
    estado: ''
  });
  const [showDetalle, setShowDetalle] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [showHistorialPagos, setShowHistorialPagos] = useState(false);
  const [showCuentasEliminadas, setShowCuentasEliminadas] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [ventasCredito, setVentasCredito] = useState([]);

  // Estado para almacenar las cuentas (inicialmente vacío para evitar cliente de ejemplo)
  const [cuentas, setCuentas] = useState([]);

  // Helper para parsear fechas (retorna Date o null)
  const parseDate = (val) => {
    if (!val) return null;
    try {
      if (typeof val === 'string') {
        // Extraer YYYY-MM-DD al inicio (maneja tanto 'YYYY-MM-DD' como 'YYYY-MM-DDTHH:MM:SSZ')
        const m = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          const y = Number(m[1]);
          const mo = Number(m[2]) - 1;
          const day = Number(m[3]);
          // Crear la fecha en horario local evitando conversiones automáticas de zona que cambian el día
          const dLocal = new Date(y, mo, day);
          if (!isNaN(dLocal)) return dLocal;
        }
      }
      const d = new Date(val);
      if (isNaN(d)) return null;
      return d;
    } catch { return null; }
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

  // Cargar ventas con método Crédito (Deuda) para mostrarlas como cuentas por cobrar
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await ventasApi.listVentas({ metodoPago: 'Credito (Deuda)' });
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        if (!mounted) return;
        setVentasCredito(list || []);
      } catch (err) {
        console.error('Error cargando ventas a crédito:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Combinar cuentas internas y ventas a crédito en una sola lista para mostrar
  const cuentasCombinadas = React.useMemo(() => {
    const ventasMapeadas = (ventasCredito || []).map(v => {
      const montoTotal = Number(v.total) || 0;
      const montoPagado = Number(v.monto_pagado ?? v.montoPagado ?? v.pagado ?? 0) || 0;
      const fechaVenc = v.fecha_final ?? v.fecha_vencimiento ?? '';
      // mantener la fecha exactamente como viene del backend (sin formateo)
      const fechaEm = v.fecha ?? v.fecha_emision ?? '';
      const cliente = typeof v.cliente === 'string' ? v.cliente : (v.cliente?.nombre || v.cliente?.razon_social || v.cliente?.name || '') || '';
      const rut = v.cliente?.rut || v.cliente_rut || v.rut || '';
      const documento = v.folioVenta || v.folio_venta || v.folio || v.documentoVenta || v.documento || '';
      const diasMora = (function(){
        const d = parseDate(fechaVenc);
        if (!d) return 0;
        // comparar solo la parte de fecha (sin horas) para evitar off-by-one por zona
        const hoy = new Date();
        const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const vencLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return vencLocal < hoyLocal ? Math.floor((hoyLocal - vencLocal)/(1000*60*60*24)) : 0;
      })();
      const estado = (Number(montoPagado) >= Number(montoTotal)) ? 'pagada' : (diasMora > 0 ? 'vencida' : 'pendiente');

      return {
        id: `venta-${v.id ?? documento}`,
        cliente,
        rut,
        documento,
        // exponer separadamente número y tipo de documento para el modal
        numeroDocumento: documento,
        tipoDocumento: v.documentoVenta ?? v.documento_venta ?? v.tipo_documento ?? v.tipoDocumento ?? v.documento_tipo ?? '',
        // contacto: usar contacto_principal si existe, fallback a campos anteriores
        contacto: v.cliente?.contacto_principal ?? v.contacto_principal ?? v.cliente?.contacto ?? v.cliente?.contact_name ?? v.cliente?.contacto_nombre ?? v.contacto ?? '',
        // teléfono principal si existe
        telefono: v.cliente?.telefono_principal ?? v.telefono_principal ?? v.cliente?.telefono ?? v.telefono ?? undefined,
        fechaEmision: fechaEm,
        fechaVencimiento: fechaVenc,
        diasMora,
        montoTotal,
        montoPagado,
        estado,
        origen: 'Venta'
      };
    });

    return [...(cuentas || []), ...ventasMapeadas];
  }, [cuentas, ventasCredito]);

  // Aplicar filtros sobre las cuentas combinadas
  const filteredCuentas = React.useMemo(() => {
    const q = (String(filtros.cliente || '').trim()).toLowerCase();
    const docQ = (String(filtros.documento || '').trim()).toLowerCase();
    const estadoQ = String(filtros.estado || '').trim().toLowerCase();
    const fechaQ = filtros.fecha ? String(filtros.fecha).slice(0,10) : '';

    return (cuentasCombinadas || []).filter(c => {
      // buscar por cliente o rut
      if (q) {
        const cliente = String(c.cliente || '').toLowerCase();
        const rut = String(c.rut || '').toLowerCase();
        if (!(cliente.includes(q) || rut.includes(q))) return false;
      }

      // buscar por documento
      if (docQ) {
        const doc = String(c.documento || '').toLowerCase();
        if (!doc.includes(docQ)) return false;
      }

      // filtro por estado exacto (pendiente, vencida, pagada)
      if (estadoQ) {
        const estado = String(c.estado || '').toLowerCase();
        if (estado !== estadoQ) return false;
      }

      // filtro por fecha de emisión (comparar YYYY-MM-DD usando fecha parseada)
      if (fechaQ) {
        const feDate = parseDate(c.fechaEmision);
        if (!feDate) return false;
        const y = feDate.getFullYear();
        const m = String(feDate.getMonth() + 1).padStart(2, '0');
        const d = String(feDate.getDate()).padStart(2, '0');
        const fe = `${y}-${m}-${d}`;
        if (fe !== fechaQ) return false;
      }

      return true;
    });
  }, [filtros, cuentasCombinadas]);

  // Totales y métricas (basadas en las cuentas filtradas para que los filtros afecten los resúmenes)
  const resumen = React.useMemo(() => {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finRangoPorVencer = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

    let totalPorCobrar = 0;
    let cobradoEsteMes = 0;
    let porVencer = 0;
    let vencidas = 0;
    let cuentasPendientes = 0;

    (filteredCuentas || []).forEach(c => {
      const total = Number(c.montoTotal || 0);
      const pagado = Number(c.montoPagado || 0);
      const saldo = Math.max(0, total - pagado);
      const fv = parseDate(c.fechaVencimiento);
      const fe = parseDate(c.fechaEmision);

      totalPorCobrar += saldo;

      if (fe && fe >= inicioMes && fe <= ahora) {
        cobradoEsteMes += pagado;
      }

      if (fv) {
        if (fv < ahora) {
          vencidas += saldo;
        } else if (fv > ahora && fv <= finRangoPorVencer) {
          porVencer += saldo;
        }
      }

      if ((c.estado || '').toString().toLowerCase() !== 'pagada') cuentasPendientes += 1;
    });

    return {
      totalPorCobrar,
      cobradoEsteMes,
      porVencer,
      vencidas,
      cuentasPendientes
    };
  }, [filteredCuentas]);

  const handleVerDetalle = async (cuenta) => {
    try {
      // Si la cuenta viene de una venta, intentar obtener detalle completo desde la API
      if (cuenta && cuenta.origen === 'Venta' && String(cuenta.id).startsWith('venta-')) {
        const ventaId = String(cuenta.id).replace(/^venta-/, '');
        try {
          const venta = await ventasApi.getVenta(ventaId);

          // Si la venta no trae pagos adjuntos, llamar al endpoint de CxC para obtenerlos
          let pagosRes = null;
          if (!venta?.historialPagos && !venta?.historial_pagos) {
            try {
              pagosRes = await ventasApi.getPagosPorVenta(ventaId);
            } catch (err) {
              // no abortar: puede que no existan pagos o falló la llamada
              pagosRes = null;
            }
          }

          const pagosList = pagosRes?.pagos ?? (venta?.historialPagos ?? venta?.historial_pagos ?? []);
          const montoPagadoFromPagos = pagamentosToMonto(pagosList) || (venta.monto_pagado ?? venta.montoPagado ?? venta.pagado ?? 0);

          // intentar obtener id de cuenta_cobrar desde los pagos (primer pago)
          const cuentaIdDesdePagos = (pagosRes?.pagos && pagosRes.pagos.length > 0) ? (pagosRes.pagos[0].cuenta_cobrar_id ?? pagosRes.pagos[0].raw['cuenta_cobrar_id'] ?? null) : null;

          const numeroDocumento = venta.folioVenta ?? venta.folio_venta ?? venta.folio ?? venta.documentoVenta ?? venta.documento ?? cuenta.numeroDocumento ?? '';

          const cuentaEnriquecida = {
            ...cuenta,
            numeroDocumento,
            tipoDocumento,
            contacto,
            telefono,
            montoTotal,
            montoPagado,
            fechaEmision,
            fechaVencimiento,
            historialPagos: pagosList || [],
            observaciones: venta.observaciones ?? venta.observacion ?? cuenta.observaciones ?? '',
            cuentaId: cuentaIdDesdePagos || null,
            cuenta_cobrar_id: cuentaIdDesdePagos || null,
          };

          setCuentaSeleccionada(cuentaEnriquecida);
          setShowDetalle(true);
          return;
        } catch (err) {
          console.warn('No se pudo obtener detalle de venta, se mostrará lo disponible:', err);
          // continuar y mostrar lo que tenemos
        }
      }

      // Si no es venta, pero la cuenta tiene id, intentar obtener pagos por cuenta
      if (cuenta && cuenta.id) {
        try {
          const pagosRes = await ventasApi.getPagosPorCuenta(cuenta.id);
          const pagosList = pagosRes?.pagos ?? [];
          const montoPagado = pagamentosToMonto(pagosList) || (cuenta.montoPagado ?? cuenta.monto_pagado ?? cuenta.pagado ?? 0);

          const cuentaEnriquecida = {
            ...cuenta,
            historialPagos: pagosList,
            montoPagado
          };
          setCuentaSeleccionada(cuentaEnriquecida);
          setShowDetalle(true);
          return;
        } catch (err) {
          console.warn('No se pudo obtener pagos por cuenta:', err);
        }
      }

      setCuentaSeleccionada(cuenta);
      setShowDetalle(true);
    } catch (error) {
      console.error('Error al preparar detalle:', error);
      setCuentaSeleccionada(cuenta);
      setShowDetalle(true);
    }
  };

  // Helper: sumar montos desde la estructura de pagos del backend
  const pagamentosToMonto = (pagos) => {
    try {
      if (!Array.isArray(pagos)) return 0;
      return pagos.reduce((s, p) => s + (Number(p.monto ?? p.monto_pagado ?? p.valor ?? p.importe ?? 0) || 0), 0);
    } catch (e) { return 0; }
  };

  const handleRegistrarPago = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    setShowPago(true);
  };

  // Manejar pago guardado desde el modal: actualizar datos locales (ventasCredito o cuentas)
  const handlePagoSave = async (pago) => {
    // Persistir pago en backend y luego actualizar estado local con la respuesta
    try {
      const monto = Number(pago.monto) || 0;

      // Preparar payload para API
      const payload = {
        fecha_pago: pago.fecha,
        monto: monto,
        metodo_pago: pago.metodoPago?.tipo ?? (pago.metodoPago || ''),
        comprobante: pago.metodoPago?.numeroVoucher ?? pago.metodoPago?.numeroCheque ?? pago.comprobante ?? null,
        // compat: algunos modales envían cuenta_bancaria_id; otros enviarán banco_id
        cuenta_bancaria_id: pago.metodoPago?.cuenta_bancaria_id ?? pago.cuenta_bancaria_id ?? null,
        banco_id: pago.metodoPago?.banco_id ?? pago.banco_id ?? (pago.metodoPago?.cuenta_bancaria_id ?? pago.cuenta_bancaria_id ?? null),
        observaciones: pago.observaciones ?? null
      };

      if (cuentaSeleccionada?.origen === 'Venta' && String(cuentaSeleccionada.id).startsWith('venta-')) {
        payload.venta_id = Number(String(cuentaSeleccionada.id).replace(/^venta-/, '')) || null;
      } else if (cuentaSeleccionada?.id) {
        payload.cuenta_id = cuentaSeleccionada.id;
      }

      const resp = await fetch(`${API_BASE_URL}/cuentas-cobrar/pagos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        const msg = data?.message || data?.errors || 'Error al guardar pago en el servidor';
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }

      // data should contain { pago, cuenta }
      const pagoResp = data?.pago ?? null;
      const cuentaResp = data?.cuenta ?? null;

      // Actualizar ventasCredito o cuentas según corresponda
      if (payload.venta_id) {
        const ventaId = String(payload.venta_id);
        setVentasCredito(prev => (prev || []).map(v => {
          if (String(v.id) === ventaId) {
            const total = Number(v.total || 0);
            const saldoPendiente = Number(cuentaResp?.saldo_pendiente ?? cuentaResp?.saldo ?? 0);
            const nuevoPagado = Math.max(0, total - saldoPendiente);
            const historial = v.historialPagos ?? v.historial_pagos ?? [];
            const nuevoHist = pagoResp ? [...historial, { fecha: pagoResp.fecha_pago ?? pagoResp.fecha ?? pagoResp.created_at ?? pagoResp.createdAt ?? pagoResp.fecha, monto: pagoResp.monto ?? pagoResp.valor ?? 0, metodoPago: pagoResp.metodo_pago ?? pagoResp.metodoPago ?? '' }] : historial;
            return { ...v, monto_pagado: nuevoPagado, montoPagado: nuevoPagado, pagado: nuevoPagado, historialPagos: nuevoHist, historial_pagos: nuevoHist };
          }
          return v;
        }));
      } else if (payload.cuenta_id) {
        setCuentas(prev => (prev || []).map(c => {
          if (c.id === payload.cuenta_id) {
            const total = Number(c.montoTotal ?? c.monto_total ?? 0);
            const saldoPendiente = Number(cuentaResp?.saldo_pendiente ?? cuentaResp?.saldo ?? 0);
            const nuevoPagado = Math.max(0, total - saldoPendiente);
            const historial = c.historialPagos ?? [];
            const nuevoHist = pagoResp ? [...historial, { fecha: pagoResp.fecha_pago ?? pagoResp.fecha ?? pagoResp.created_at ?? pagoResp.createdAt ?? pagoResp.fecha, monto: pagoResp.monto ?? pagoResp.valor ?? 0, metodoPago: pagoResp.metodo_pago ?? '' }] : historial;
            return { ...c, montoPagado: nuevoPagado, monto_pagado: nuevoPagado, pagado: nuevoPagado, historialPagos: nuevoHist };
          }
          return c;
        }));
      }

      // Actualizar cuentaSeleccionada con datos devueltos
      if (cuentaResp) {
        setCuentaSeleccionada(prev => ({
          ...prev,
          montoPagado: prev ? (Number(prev.montoPagado || prev.monto_pagado || prev.pagado || 0) + monto) : undefined,
          monto_pagado: prev ? (Number(prev.montoPagado || prev.monto_pagado || prev.pagado || 0) + monto) : undefined,
          pagado: prev ? (Number(prev.montoPagado || prev.monto_pagado || prev.pagado || 0) + monto) : undefined,
          historialPagos: (prev?.historialPagos ?? []).concat(pagoResp ? [{ fecha: pagoResp.fecha_pago ?? pagoResp.fecha ?? pagoResp.created_at ?? pagoResp.createdAt ?? pagoResp.fecha, monto: pagoResp.monto ?? pagoResp.valor ?? 0, metodoPago: pagoResp.metodo_pago ?? '' }] : [])
        }));
      }

      // Cerrar modal SOLO si el guardado fue exitoso
      setShowPago(false);

    } catch (err) {
      console.error('Error al guardar pago en servidor:', err);
      // Mostrar mensaje claro al usuario y mantener el modal abierto para corrección
      const msg = err.message || 'No se pudo registrar el pago en el servidor';
      alert('Error al registrar pago: ' + msg);
      // no cerrar el modal para que el usuario pueda corregir
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (showHistorialPagos) {
    return <HistorialPagos onBack={() => setShowHistorialPagos(false)} />;
  }

  if (showCuentasEliminadas) {
    return <CuentasCobrarEliminadas onBack={() => setShowCuentasEliminadas(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Cuentas por Cobrar</h2>
        <div className="d-flex gap-2">
          {/* Botón Nueva Cuenta eliminado según solicitud */}
          <button 
            className="btn btn-primary"
            onClick={() => setShowHistorialPagos(true)}
          >
            <i className="bi bi-clock-history me-2"></i>
            Historial de Pagos
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => setShowCuentasEliminadas(true)}
          >
            <i className="bi bi-trash me-2"></i>
            Cuentas Eliminadas
          </button>
          <button 
            className="btn btn-light"
            onClick={() => {
              const dataToExport = filteredCuentas.map(cuenta => {
                const fv = parseDate(cuenta.fechaVencimiento);
                const hoy = new Date();
                const diasMora = fv ? (fv < hoy ? Math.floor((hoy - fv) / (1000 * 60 * 60 * 24)) : 0) : 0;

                return {
                  Cliente: cuenta.cliente,
                  RUT: cuenta.rut,
                  Documento: cuenta.documento,
                  'Fecha Emisión': formatDate(cuenta.fechaEmision) || '',
                  'Fecha Vencimiento': formatDate(cuenta.fechaVencimiento) || '',
                  'Días Mora': diasMora,
                  'Monto Total': cuenta.montoTotal,
                  'Monto Pagado': cuenta.montoPagado,
                  Saldo: Number(cuenta.montoTotal || 0) - Number(cuenta.montoPagado || 0),
                  Estado: diasMora > 0 ? 'Vencida' : 
                          (Number(cuenta.montoPagado || 0) >= Number(cuenta.montoTotal || 0) ? 'Pagada' : 'Pendiente')
                };
              });

              exportToExcel(dataToExport, 'CuentasPorCobrar');
            }}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fecha}
                onChange={(e) => handleFiltroChange('fecha', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Cliente</label>
              <input
                type="text"
                className="form-control"
                value={filtros.cliente}
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                placeholder="Buscar por cliente..."
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">N° Documento</label>
              <input
                type="text"
                className="form-control"
                value={filtros.documento}
                onChange={(e) => handleFiltroChange('documento', e.target.value)}
                placeholder="Número de documento..."
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Estado</label>
              <select 
                className="form-select"
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencida">Vencida</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Cuentas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Total por Cobrar</h6>
              <h3>${resumen.totalPorCobrar ? resumen.totalPorCobrar.toLocaleString() : '0'}</h3>
              <small>{resumen.cuentasPendientes} cuentas pendientes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Cobrado este Mes</h6>
              <h3>${resumen.cobradoEsteMes ? resumen.cobradoEsteMes.toLocaleString() : '0'}</h3>
              <small>{/* conteo no disponible por ahora */} cobros este mes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Por Vencer</h6>
              <h3>${resumen.porVencer ? resumen.porVencer.toLocaleString() : '0'}</h3>
              <small>cuentas próximas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Vencidas</h6>
              <h3>${resumen.vencidas ? resumen.vencidas.toLocaleString() : '0'}</h3>
              <small>cuentas vencidas</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-success text-white">
          <h5 className="card-title mb-0">Cuentas por Cobrar</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Cliente</th>
                  <th>RUT</th>
                  <th>Documento</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Vencimiento</th>
                  <th>Días Mora</th>
                  <th>Monto Total</th>
                  <th>Monto Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCuentas.map((cuenta) => {
                  const hoy = new Date();
                  const fechaVencimientoDate = parseDate(cuenta.fechaVencimiento);
                  const diasMora = fechaVencimientoDate ? (fechaVencimientoDate < hoy ? Math.floor((hoy - fechaVencimientoDate) / (1000 * 60 * 60 * 24)) : 0) : 0;

                  return (
                    <tr key={cuenta.id}>
                      <td>{cuenta.cliente}</td>
                      <td>{cuenta.rut}</td>
                      <td>{cuenta.documento}</td>
                      <td>{formatDate(cuenta.fechaEmision) || ''}</td>
                      <td>{formatDate(cuenta.fechaVencimiento) || ''}</td>
                      <td className={diasMora > 0 ? 'text-danger' : ''}>
                        {diasMora > 0 ? `${diasMora} días` : '-'}
                      </td>
                      <td>${Number(cuenta.montoTotal || 0).toLocaleString()}</td>
                      <td>${Number(cuenta.montoPagado || 0).toLocaleString()}</td>
                      <td className="text-danger">${Number((cuenta.montoTotal || 0) - (cuenta.montoPagado || 0)).toLocaleString()}</td>
                      <td>
                        <span className={`badge bg-${
                          diasMora > 0 ? 'danger' : 
                          (Number(cuenta.montoPagado || 0) >= Number(cuenta.montoTotal || 0)) ? 'success' : 
                          'warning'
                        }`}>
                          {diasMora > 0 ? 'Vencida' : 
                           (Number(cuenta.montoPagado || 0) >= Number(cuenta.montoTotal || 0)) ? 'Pagada' : 
                           'Pendiente'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleVerDetalle(cuenta)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleRegistrarPago(cuenta)}
                            disabled={Number(cuenta.montoPagado || 0) === Number(cuenta.montoTotal || 0)}
                          >
                            <i className="bi bi-cash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  {/* ColSpan 6 para cubrir Cliente..Días Mora, luego totales en Monto Total / Monto Pagado / Saldo, y dos celdas finales (Estado, Acciones) */}
                  <td colSpan="6">TOTAL</td>
                  <td>${filteredCuentas.reduce((sum, cuenta) => sum + Number(cuenta.montoTotal || 0), 0).toLocaleString()}</td>
                  <td>${filteredCuentas.reduce((sum, cuenta) => sum + Number(cuenta.montoPagado || 0), 0).toLocaleString()}</td>
                  <td className="text-danger">${filteredCuentas.reduce((sum, cuenta) => sum + (Number(cuenta.montoTotal || 0) - Number(cuenta.montoPagado || 0)), 0).toLocaleString()}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {showDetalle && cuentaSeleccionada && (
        <DetalleCuentaCobrar 
          cuenta={cuentaSeleccionada}
          onClose={() => {
            setShowDetalle(false);
            setCuentaSeleccionada(null);
          }}
        />
      )}

      {showPago && cuentaSeleccionada && (
        <PagoCuentaCobrar
          cuenta={cuentaSeleccionada}
          onClose={() => {
            // Solo cerrar el modal de pago; no limpiar la selección aquí para permitir
            // que el estado de la cuenta se actualice y permanezca visible en el detalle.
            setShowPago(false);
          }}
          onSave={handlePagoSave}
        />
      )}
    </div>
  );
}

export default CuentasXCobrar;