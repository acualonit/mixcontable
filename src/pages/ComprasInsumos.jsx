import React, { useEffect, useMemo, useState } from 'react';
import NuevaCompra from '../components/compras/NuevaCompra';
import DetalleCompra from '../components/compras/DetalleCompra';
import ComprasEliminadas from '../components/compras/ComprasEliminadas';
import { listCompras, createCompra, updateCompra, deleteCompra, getCompra } from '../utils/comprasApi';
import { fetchProveedores, fetchPublicSucursales, fetchEmpresas, fetchSucursales } from '../utils/configApi';

function ComprasInsumos() {
  const [showNuevaCompra, setShowNuevaCompra] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showComprasEliminadas, setShowComprasEliminadas] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [compraEnEdicion, setCompraEnEdicion] = useState(null);

  const [filtros, setFiltros] = useState({
    fecha: '',
    proveedor_id: '',
    sucursal_id: '',
    estado: ''
  });

  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [proveedores, setProveedores] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const sucursalesMap = useMemo(() => {
    const map = {};
    (sucursales || []).forEach(s => {
      const id = s.id ?? s.value ?? s.key ?? s.id_sucursal ?? null;
      const name = s.nombre ?? s.name ?? s.sucursal_nombre ?? s.label ?? s.nombre_sucursal ?? String(s);
      if (id != null) map[String(id)] = name;
    });
    return map;
  }, [sucursales]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filtros.fecha) params.fecha = filtros.fecha;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.proveedor_id) params.proveedor_id = filtros.proveedor_id;
      if (filtros.sucursal_id) params.sucursal_id = filtros.sucursal_id;

      // obtener compras y proveedores primero
      const [comprasResp, provResp] = await Promise.all([
        listCompras(params),
        fetchProveedores().catch(() => []),
      ]);

      const items = Array.isArray(comprasResp?.data) ? comprasResp.data : (Array.isArray(comprasResp) ? comprasResp : []);
      setCompras(items);
      setProveedores(Array.isArray(provResp?.data) ? provResp.data : (Array.isArray(provResp) ? provResp : []));

      // intentar obtener empresa y luego sucursales por empresa (mismo patrón que en otros módulos)
      let sucResp = [];
      try {
        const empresasResp = await fetchEmpresas().catch(() => []);
        const empresa = Array.isArray(empresasResp) ? empresasResp[0] : (empresasResp?.data ? empresasResp.data[0] : null);
        if (empresa && empresa.id) {
          sucResp = await fetchSucursales(empresa.id).catch(() => []);
        } else {
          sucResp = await fetchPublicSucursales().catch(() => []);
        }
      } catch (err2) {
        sucResp = [];
      }

      const rawList = Array.isArray(sucResp?.data) ? sucResp.data : (Array.isArray(sucResp) ? sucResp : (sucResp?.sucursales ?? []));
      const normalized = (rawList || []).map((s) => {
        const id = s?.id ?? s?.id_sucursal ?? s?.value ?? s?.key ?? String(s);
        const nombre = s?.nombre ?? s?.name ?? s?.sucursal_nombre ?? s?.nombre_sucursal ?? s?.label ?? String(s);
        return { ...s, id, nombre };
      });
      setSucursales(normalized);
    } catch (e) {
      setError(e?.message || 'Error cargando compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.fecha, filtros.estado, filtros.proveedor_id, filtros.sucursal_id]);

  const toNumber = (v) => Number(v ?? 0);

  const resumenCompras = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const hoyStr = `${yyyy}-${mm}-${dd}`;
    const mesStr = `${yyyy}-${mm}`;

    // Mes anterior
    const dPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMesStr = `${dPrev.getFullYear()}-${String(dPrev.getMonth() + 1).padStart(2, '0')}`;

    const base = compras.filter((c) => c?.estado !== 'ELIMINADA');

    const sum = (arr) => arr.reduce((acc, c) => acc + toNumber(c?.total_bruto), 0);
    const sumIva = (arr) => arr.reduce((acc, c) => acc + toNumber(c?.total_impuesto), 0);

    const hoy = base.filter((c) => String(c?.fecha || '').slice(0, 10) === hoyStr);
    const mes = base.filter((c) => String(c?.fecha || '').slice(0, 7) === mesStr);
    const mesAnterior = base.filter((c) => String(c?.fecha || '').slice(0, 7) === prevMesStr);
    const anio = base.filter((c) => String(c?.fecha || '').slice(0, 4) === String(yyyy));

    return {
      comprasHoy: { cantidad: hoy.length, total: sum(hoy), iva: sumIva(hoy) },
      comprasMes: { cantidad: mes.length, total: sum(mes), iva: sumIva(mes) },
      comprasMesAnterior: { cantidad: mesAnterior.length, total: sum(mesAnterior), iva: sumIva(mesAnterior) },
      comprasAnio: { cantidad: anio.length, total: sum(anio), iva: sumIva(anio) },
    };
  }, [compras]);

  const handleVerDetalle = async (compraRow) => {
    try {
      // intentar obtener la compra completa del servidor (incluye historial y detalles completos)
      const full = await getCompra(compraRow.id || compraRow.numeroInterno || compraRow.id_sucursal);
      console.debug('[ComprasInsumos] getCompra (detalle) response:', full);

      // Normalizar historial: soportar varias formas que venga desde la API
      const rawHist = full?.historial || full?.historial_cambios || full?.historialEstados || full?.historial_estados || full?.changes || full?.auditoria || [];
      const historial = Array.isArray(rawHist)
        ? rawHist.map(h => ({
            fecha: h?.fecha || h?.created_at || h?.createdAt || h?.date || '',
            usuario: h?.usuario || h?.user || h?.nombre_usuario || h?.user_name || h?.actor || '',
            accion: h?.accion || h?.action || h?.tipo || h?.descripcion || JSON.stringify(h),
          }))
        : [];

      const detalles = Array.isArray(full?.detalles)
        ? full.detalles
        : Array.isArray(full?.detalles?.data)
        ? full.detalles.data
        : Array.isArray(full?.detalles_compra)
        ? full.detalles_compra
        : [];

      const items = detalles.map((d) => ({
        descripcion: d?.descripcion_item ?? d?.descripcion ?? '',
        cantidad: Number(d?.cantidad ?? 0),
        precioUnitario: Number(d?.costo_unitario ?? d?.precio_unitario ?? 0),
      }));

      const normalized = {
        numeroInterno: full?.id ?? compraRow?.id,
        fecha: String(full?.fecha || compraRow?.fecha || '').slice(0, 10),
        sucursal: (full?.sucursal?.nombre) || full?.sucursal_nombre || full?.sucursal_name || sucursalesMap[String(full?.sucursal_id ?? full?.id_sucursal ?? full?.sucursal ?? compraRow?.sucursal_id ?? '')] || '-',
        proveedor: full?.proveedor?.razon_social || full?.proveedor?.nombre_comercial || full?.proveedor?.rut || compraRow?.proveedor || '-',
        rut: full?.proveedor?.rut || compraRow?.rut || '-',
        tipoDocumento: full?.tipo_documento || full?.documentoCompra || compraRow?.tipo_documento || '-',
        numeroDocumento: full?.folio || full?.numero_documento || compraRow?.folio || '-',
        estado: (full?.estado || compraRow?.estado || 'REGISTRADA').toLowerCase(),
        subtotal: Number(full?.total_neto ?? full?.total ?? compraRow?.subtotal ?? 0),
        iva: Number(full?.total_impuesto ?? full?.iva ?? compraRow?.iva ?? 0),
        total: Number(full?.total_bruto ?? full?.total ?? compraRow?.total ?? 0),
        items,
        historial,
        observaciones: full?.observaciones || compraRow?.observaciones || '',
      };

      setCompraSeleccionada(normalized);
      setShowDetalle(true);
    } catch (err) {
      console.error('Error cargando detalle de compra:', err);
      // fallback al objeto ya disponible (sin historial)
      setCompraSeleccionada(normalizeCompraForDetalle(compraRow));
      setShowDetalle(true);
    }
  };

  const normalizeCompraForDetalle = (c) => {
    const detalles = Array.isArray(c?.detalles) ? c.detalles : [];
    const items = detalles.map((d) => ({
      descripcion: d?.descripcion_item ?? d?.descripcion ?? '',
      cantidad: Number(d?.cantidad ?? 0),
      precioUnitario: Number(d?.costo_unitario ?? d?.precio_unitario ?? 0),
    }));

    return {
      numeroInterno: c?.id,
      fecha: String(c?.fecha || '').slice(0, 10),
      sucursal: (c?.sucursal?.nombre) || c?.sucursal_nombre || c?.sucursal_name || sucursalesMap[String(c?.sucursal_id ?? c?.id_sucursal ?? c?.sucursal ?? '')] || '-',
      proveedor: c?.proveedor?.razon_social || c?.proveedor?.nombre_comercial || c?.proveedor?.rut || '-',
      rut: c?.proveedor?.rut || '-',
      tipoDocumento: c?.tipo_documento || '-',
      numeroDocumento: c?.folio || '-',
      estado: (c?.estado || 'REGISTRADA').toLowerCase(),
      subtotal: Number(c?.total_neto ?? 0),
      iva: Number(c?.total_impuesto ?? 0),
      total: Number(c?.total_bruto ?? 0),
      items,
      historial: [],
      observaciones: c?.observaciones || '',
    };
  };

  const handleGuardarCompra = async (compraData) => {
    // Mapear payload del formulario (front) a esquema del backend (DB)
    const detalles = (compraData.items || []).map((it) => {
      const cantidad = Number(it.cantidad ?? 0);
      const costoUnitario = Number(it.valor ?? it.precioUnitario ?? 0);
      return {
        descripcion_item: it.descripcion ?? '',
        cantidad,
        costo_unitario: costoUnitario,
        descuento_porcentaje: 0,
        impuesto_porcentaje: 0,
        total_linea: cantidad * costoUnitario,
      };
    });

    const payload = {
      fecha: compraData.fecha,
      proveedor_id: compraData.proveedor_id || null,
      sucursal_id: compraData.sucursal_id ?? compraData.sucursal ?? (compraData.sucursal && compraData.sucursal.id) ?? null,
      tipo_documento: compraData.documentoCompra,
      folio: compraData.folioCompra || null,
      total_neto: compraData.subtotal,
      total_impuesto: compraData.iva,
      total_bruto: compraData.total,
      observaciones: compraData.observaciones || null,
      estado: 'REGISTRADA',
      detalles,
    };

    // Añadir fecha_final si está presente en el formulario (o null explícito)
    // Soportar varias claves posibles y normalizar cadenas vacías a null
    const fechaFinalVal = compraData.fecha_final ?? compraData.fechaFinal ?? null;
    payload.fecha_final = fechaFinalVal ? String(fechaFinalVal) : null;

    // Manejar métodos de pago de forma defensiva: soportar metodoPago1, metodos_pago existente u otras formas
    if (Array.isArray(compraData.metodos_pago) && compraData.metodos_pago.length > 0) {
      // Normalizar cada entrada
      payload.metodos_pago = compraData.metodos_pago.map((m) => ({
        tipo: m?.tipo ?? m?.tipo_pago ?? m?.name ?? null,
        monto: Number(m?.monto ?? m?.amount ?? 0),
      }));
      // También enviar un campo literal metodo_pago tomando la primera entrada si existe
      payload.metodo_pago = payload.metodos_pago[0]?.tipo ?? null;
    } else if (compraData.metodoPago1) {
      const tipo = compraData.metodoPago1.tipo ?? compraData.metodoPago1?.tipo_pago ?? compraData.metodoPago1?.name ?? null;
      const monto = Number(compraData.metodoPago1.monto ?? compraData.metodoPago1?.amount ?? 0);
      payload.metodo_pago = tipo;
      payload.metodos_pago = [ { tipo, monto } ];
    }

    try {
      if (compraEnEdicion?.id) {
        await updateCompra(compraEnEdicion.id, payload);
      } else {
        await createCompra(payload);
      }

      setCompraEnEdicion(null);
      setShowNuevaCompra(false);
      await loadData();
    } catch (e) {
      alert(e?.message || 'Error al guardar compra');
    }
  };

  const handleEliminarCompra = async (compraId) => {
    const ok = confirm('¿Eliminar esta compra?');
    if (!ok) return;

    try {
      await deleteCompra(compraId);
      await loadData();
    } catch (e) {
      alert(e?.message || 'Error al eliminar compra');
    }
  };

  const handleEditarCompra = async (c) => {
    try {
      // Obtener compra completa (incluye detalles, proveedor, sucursal)
      const full = await getCompra(c.id);
      console.debug('[ComprasInsumos] getCompra response:', full);
      // Normalizar forma de la respuesta: asegurar `detalles` como array y claves esperadas
      const detalles = Array.isArray(full?.detalles)
        ? full.detalles
        : Array.isArray(full?.detalles?.data)
        ? full.detalles.data
        : Array.isArray(full?.detalles_compra)
        ? full.detalles_compra
        : [];

      const normalized = {
        ...full,
        detalles,
        proveedor_id: full.proveedor_id ?? full.proveedor?.id ?? full.proveedor?.ID ?? full.proveedor?.proveedor_id ?? null,
        sucursal_id: full.sucursal_id ?? full.id_sucursal ?? full.sucursal?.id ?? full.sucursal?.ID ?? null,
        folio: full.folio ?? full.numero_documento ?? full.folio_compra ?? null,
        tipo_documento: full.tipo_documento ?? full.documentoCompra ?? null,
      };

      console.debug('[ComprasInsumos] normalized compra:', normalized);
      setCompraEnEdicion(normalized);
      setShowNuevaCompra(true);
    } catch (err) {
      console.error('Error cargando compra para editar:', err);
      // fallback: usar el objeto que teníamos (intentamos normalizar mínimamente)
      const fallback = {
        ...c,
        detalles: Array.isArray(c?.detalles) ? c.detalles : (Array.isArray(c?.detalles?.data) ? c.detalles.data : []),
        proveedor_id: c.proveedor_id ?? c.proveedor?.id ?? null,
        sucursal_id: c.sucursal_id ?? c.id_sucursal ?? c.sucursal?.id ?? null,
      };
      console.debug('[ComprasInsumos] fallback compra:', fallback);
      setCompraEnEdicion(fallback);
      setShowNuevaCompra(true);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (showComprasEliminadas) {
    return <ComprasEliminadas onBack={() => setShowComprasEliminadas(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Compras de Insumos</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevaCompra(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Compra
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => setShowComprasEliminadas(true)}
          >
            <i className="bi bi-trash me-2"></i>
            Compras Eliminadas
          </button>
        </div>
      </div>

      {/* Resúmenes de Compras */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Compras de Hoy</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${Number(resumenCompras.comprasHoy.total).toLocaleString()}</h3>
                  <small>{resumenCompras.comprasHoy.cantidad} compras</small>
                </div>
                <i className="bi bi-cart4 fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Compras del Mes</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${Number(resumenCompras.comprasMes.total).toLocaleString()}</h3>
                  <small>{resumenCompras.comprasMes.cantidad} compras</small>
                </div>
                <i className="bi bi-calendar-check fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6 className="card-title">Compras Mes Anterior</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${Number(resumenCompras.comprasMesAnterior.total).toLocaleString()}</h3>
                  <small>{resumenCompras.comprasMesAnterior.cantidad} compras</small>
                </div>
                <i className="bi bi-calendar-minus fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Compras del Año</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${Number(resumenCompras.comprasAnio.total).toLocaleString()}</h3>
                  <small>{resumenCompras.comprasAnio.cantidad} compras</small>
                </div>
                <i className="bi bi-calendar3 fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IVA Acumulado del Mes */}
      <div className="card mb-4">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">IVA Acumulado del Mes</h5>
        </div>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h2 className="mb-0">${Number(resumenCompras.comprasMes.iva).toLocaleString()}</h2>
              <small className="text-muted">Total IVA acumulado en el mes actual</small>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-end">
                <button className="btn btn-outline-danger" disabled>
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Generar Informe IVA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <label className="form-label">Proveedor</label>
              <select 
                className="form-select"
                value={filtros.proveedor_id}
                onChange={(e) => handleFiltroChange('proveedor_id', e.target.value)}
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.razon_social || p.nombre_comercial || p.rut}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Sucursal</label>
              <select 
                className="form-select"
                value={filtros.sucursal_id}
                onChange={(e) => handleFiltroChange('sucursal_id', e.target.value)}
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Estado</label>
              <select 
                className="form-select"
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="REGISTRADA">Registrada</option>
                <option value="ANULADA">Anulada</option>
                <option value="ELIMINADA">Eliminada</option>
              </select>
            </div>
          </div>
          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Registro de Compras</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>ID</th>
                    <th>Sucursal</th>
                    <th>Proveedor</th>
                    <th>RUT</th>
                    <th>Tipo Documento</th>
                    <th>N° Documento</th>
                    <th>Monto Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.length === 0 ? (
                    <tr><td colSpan={10} className="text-center">Sin compras</td></tr>
                  ) : (
                    compras.map((c) => (
                      <tr key={c.id}>
                        <td>{String(c.fecha || '').slice(0, 10)}</td>
                        <td>{c.id}</td>
                        <td>{(() => {
                          const raw = c?.sucursal?.nombre ?? c?.sucursal_nombre ?? c?.sucursal_name ?? null;
                          if (raw) return raw;
                          const id = String(c?.sucursal_id ?? c?.id_sucursal ?? c?.sucursal ?? '');
                          if (id && id !== 'undefined' && id !== 'null' && id !== '') return sucursalesMap[id] ?? id;
                          return '-';
                        })()}</td>
                        <td>{c?.proveedor?.razon_social || c?.proveedor?.nombre_comercial || '-'}</td>
                        <td>{c?.proveedor?.rut || '-'}</td>
                        <td>{c.tipo_documento}</td>
                        <td>{c.folio || '-'}</td>
                        <td>${Number(c.total_bruto ?? 0).toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${c.estado === 'REGISTRADA' ? 'success' : (c.estado === 'ANULADA' ? 'warning' : 'secondary')}`}>
                            {c.estado}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-sm btn-primary" onClick={() => handleVerDetalle(c)}>
                              Ver
                            </button>
                            <button className="btn btn-sm btn-warning" onClick={() => handleEditarCompra(c)}>
                              Editar
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleEliminarCompra(c.id)}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showNuevaCompra && (
        <NuevaCompra
          onClose={() => { setShowNuevaCompra(false); setCompraEnEdicion(null); }}
          initialData={compraEnEdicion}
          onSave={handleGuardarCompra}
          proveedores={proveedores}
          sucursales={sucursales}
        />
      )}

      {showDetalle && compraSeleccionada && (
        <DetalleCompra compra={compraSeleccionada} onClose={() => setShowDetalle(false)} />
      )}
    </div>
  );
}

export default ComprasInsumos;