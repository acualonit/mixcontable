import React, { useState, useEffect } from 'react';
import NuevaCuenta from '../components/banco/NuevaCuenta';
import NuevoMovimiento from '../components/banco/NuevoMovimiento';
import DetalleCuenta from '../components/banco/DetalleCuenta';
import DetalleMovimiento from '../components/banco/DetalleMovimiento';
import { fetchCuentas, fetchMovimientosBanco, createMovimientoBanco, fetchSaldoBanco, createCuenta, deleteMovimientoBanco, updateMovimientoBanco } from '../utils/bancoApi';
import { exportToExcel, prepareDataForExport, formatDateForExcel } from '../utils/exportUtils';
import { fetchEmpresas, fetchSucursales as fetchSucursalesByEmpresa, fetchPublicSucursales, fetchUsuarios } from '../utils/configApi';
import { fetchSucursales as fetchSucursalesGeneric } from '../utils/bancoApi';

function Banco() {
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [showDetalleCuenta, setShowDetalleCuenta] = useState(false);
  const [showDetalleMovimiento, setShowDetalleMovimiento] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha: '',
    categoria: '',
    tipo: ''
  });

  const [cuentas, setCuentas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [editMovimiento, setEditMovimiento] = useState(null);
  const [saldoActual, setSaldoActual] = useState(0);
  const [sucursales, setSucursales] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  // Cargar usuarios y construir mapa id -> nombre (coalesce de campos comunes)
  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        const res = await fetchUsuarios().catch(() => null);
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        const map = {};
        (list || []).forEach(u => {
          const id = String(u.id ?? u.user_id ?? u.id_usuario ?? '');
          const nombre = u.nombre ?? u.name ?? u.nombre_completo ?? u.usuario_nombre ?? u.email ?? '';
          if (id) map[id] = nombre || String(u.id);
        });
        if (mounted) setUsersMap(map);
      } catch (e) {
        // ignore
      }
    };
    loadUsers();
    return () => { mounted = false; };
  }, []);

  const getCuentaDisplay = (cuenta) => {
    if (!cuenta) return '';
    const sucursalNombre = cuenta.sucursal_nombre ?? cuenta.sucursalNombre ?? cuenta.cuenta_sucursal_nombre ?? null;
    let sucDisplay = sucursalNombre;
    try {
      if (!sucDisplay) {
        const sucId = cuenta.id_sucursal ?? cuenta.sucursal_id ?? cuenta.sucursal ?? null;
        if (sucId != null) {
          const found = (sucursales || []).find(s => String(s.id) === String(sucId));
          sucDisplay = found?.nombre ?? found?.name ?? null;
        }
      }
    } catch (e) {
      sucDisplay = sucDisplay || null;
    }

    const banco = cuenta.banco ?? cuenta.nombre ?? cuenta.name ?? '';
    const numero = cuenta.numero_cuenta ?? cuenta.numeroCuenta ?? cuenta.numero ?? cuenta.account_number ?? cuenta.numeroCuentaString ?? '';
    const base = banco && numero ? `${banco} - ${numero}` : (numero ? String(numero) : (banco ? String(banco) : String(cuenta.id ?? '')));
    return sucDisplay ? `${sucDisplay} - ${base}` : base;
  };

  const normalizeSucursales = (rawList) => {
    const list = Array.isArray(rawList) ? rawList : (rawList?.data && Array.isArray(rawList.data) ? rawList.data : (rawList?.sucursales && Array.isArray(rawList.sucursales) ? rawList.sucursales : []));
    return (list || []).map((s) => {
      const id = s?.id ?? s?.id_sucursal ?? s?.value ?? s?.key ?? (s?.original && (s.original.id ?? s.original.ID)) ?? String(s);
      const nombre = s?.nombre ?? s?.name ?? s?.sucursal_nombre ?? s?.nombre_sucursal ?? s?.label ?? (s?.original && (s.original.nombre || s.original.name || s.original.sucursal_nombre)) ?? String(s);
      return { id, nombre, original: s };
    }).filter(x => x.id != null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchCuentas();
        const c = res?.data || [];
        setCuentas(c);
        // por defecto mostrar "Todas las cuentas" (valor vacío)
        setCuentaSeleccionada((prev) => (prev === '' || prev == null ? '' : prev));
      } catch (err) {
        console.error('Error cargando cuentas:', err);
        return;
      }

      // cargar sucursales: intentar por empresa, si no usar endpoint público
      try {
        let rawList = [];
        try {
          const empresasResp = await fetchEmpresas().catch(() => []);
          const empresa = Array.isArray(empresasResp) ? empresasResp[0] : (empresasResp?.data ? empresasResp.data[0] : null);
          if (empresa && empresa.id) {
            const sucResp = await fetchSucursalesByEmpresa(empresa.id).catch(() => []);
            rawList = sucResp;
          } else {
            const sucResp = await fetchPublicSucursales().catch(() => []);
            rawList = sucResp;
          }
        } catch (innerErr) {
          rawList = [];
        }

        // Si la respuesta anterior no entregó datos, intentar el endpoint genérico del módulo banco
        if ((!rawList || (Array.isArray(rawList) && rawList.length === 0) || (rawList?.data && Array.isArray(rawList.data) && rawList.data.length === 0))) {
          try {
            const fallback = await fetchSucursalesGeneric().catch(() => []);
            rawList = fallback;
          } catch (ferr) {
            rawList = rawList || [];
          }
        }

        // Depuración: si no hay sucursales mostrar la respuesta cruda en consola (solo dev)
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[Banco] raw sucursales response:', rawList);
        }

        const normalized = normalizeSucursales(rawList);
        setSucursales(normalized);
      } catch (se) {
        console.warn('No se pudieron cargar sucursales', se);
        setSucursales([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadMov = async () => {
      try {
        const mv = await fetchMovimientosBanco(cuentaSeleccionada);
        const movimientosApi = mv?.data || [];

        // Detectar si un movimiento proviene de ventas/u otros módulos (para deshabilitar edición/eliminación)
        const mergedWithFlags = (movimientosApi || []).map(m => {
          try {
            const obs = String(m.observaciones ?? m.observacion ?? m.origen ?? '').toLowerCase();
            const ref = String(m.referencia ?? m.partida ?? m.reference ?? '').toLowerCase();
            const desc = String(m.descripcion ?? m.detalle ?? m.concepto ?? '').toLowerCase();

            const fromVentaReal = Boolean(
              obs.includes('origen:venta') || obs.includes('origen: venta') || obs.includes('venta_id:') ||
              obs.includes('venta:') ||
              ref.startsWith('venta-') || ref.startsWith('venta:') ||
              desc.trim().startsWith('venta ') ||
              String(m.origen ?? '').toLowerCase().includes('venta') ||
              // movimientos creados por el módulo CxC suelen contener esta frase en la descripción
              desc.includes('cobro cuenta por cobrar')
            );

            // Detectar si viene de cheque: cheque_id explicitado o tags en obs/ref/desc
            const fromChequeReal = Boolean(
              (m.cheque_id && Number(m.cheque_id) > 0) ||
              obs.includes('cheque:') || obs.includes('cheque_id:') || obs.includes('origen:cheque') ||
              ref.includes('cheque:') || desc.includes('cheque:') ||
              /cheque\s*#?\s*\d+/.test(obs + ' ' + ref + ' ' + desc)
            );

            // marca sintética (representación, no un movimiento persistente) — dejar falso por defecto
            const synthetic = Boolean(desc.includes('venta resumen') || desc.includes('ventas con metodos bancarios'));

            return { ...m, __fromVentaReal: fromVentaReal, __fromChequeReal: fromChequeReal, __syntheticFromVenta: synthetic };
          } catch (e) { return { ...m, __fromVentaReal: false, __fromChequeReal: false, __syntheticFromVenta: false }; }
        });

        setMovimientos(mergedWithFlags);
        const s = await fetchSaldoBanco(cuentaSeleccionada);
        setSaldoActual(s?.saldo ?? 0);
      } catch (err) {
        console.error('Error cargando movimientos/saldo:', err);
      }
    };
    loadMov();
  }, [cuentaSeleccionada, cuentas, sucursales]);

  // calcular saldos por fila: partiendo del saldoActual y restando/agregando cada movimiento (lista ordenada desc)
  const enrichedMovimientos = React.useMemo(() => {
    let running = Number(saldoActual || 0);
    return (movimientos || []).map(m => {
      const tipoRaw = m.tipo ?? m.tipo_movimiento ?? m.movement_type ?? '';
      const tipoLower = String(tipoRaw).toLowerCase();
      const isIngreso = tipoLower.includes('cred') || tipoLower.includes('ingreso');
      const valor = Number(m.monto ?? m.valor ?? m.amount ?? 0);
      const rowSaldo = running;
      running = isIngreso ? running - valor : running + valor;

      // Resolver cuenta: buscar por distintos campos y fallback a info embebida
      const cuentaIdCandidate = m.cuenta_id ?? m.cuenta ?? m.account_id ?? m.cuentaId ?? (m.cuenta && m.cuenta.id) ?? m.cuenta_bancaria_id ?? m.cuenta_bancaria;
      let cuentaDisplay = '';
      try {
        if (m.cuenta_banco && (m.cuenta_numero || m.cuenta_numero === 0)) {
          const suc = m.cuenta_sucursal_nombre ?? '';
          const base = `${m.cuenta_banco} - ${m.cuenta_numero}`;
          cuentaDisplay = suc ? `${suc} - ${base}` : base;
        } else if (cuentaIdCandidate != null) {
          const found = cuentas.find(c => String(c.id) === String(cuentaIdCandidate));
          if (found) cuentaDisplay = getCuentaDisplay(found);
          else if (m.cuenta && typeof m.cuenta === 'object') cuentaDisplay = getCuentaDisplay(m.cuenta);
          else if (m.cuenta_bancaria) cuentaDisplay = String(m.cuenta_bancaria);
        } else if (m.cuenta && typeof m.cuenta === 'object') {
          cuentaDisplay = getCuentaDisplay(m.cuenta);
        } else if (m.cuenta_bancaria) {
          cuentaDisplay = String(m.cuenta_bancaria);
        }
      } catch (e) {
        cuentaDisplay = '';
      }

      // Resolver sucursal: buscar nombre directo o resolver id contra sucursales
      const sucursalCandidate = m.cuenta_sucursal_nombre ?? m.sucursal ?? m.cuenta_sucursal ?? m.sucursal_id ?? m.id_sucursal ?? (m.sucursal && m.sucursal.id) ?? null;
      let sucursalDisplay = '';
      try {
        if (typeof sucursalCandidate === 'string' && sucursalCandidate.trim() !== '') {
          sucursalDisplay = sucursalCandidate;
        } else if (sucursalCandidate != null) {
          const foundS = sucursales.find(s => String(s.id) === String(sucursalCandidate));
          if (foundS) sucursalDisplay = foundS.nombre ?? foundS.name ?? String(foundS.id);
          else if (m.cuenta_sucursal_nombre) sucursalDisplay = m.cuenta_sucursal_nombre;
        } else if (m.cuenta_sucursal_nombre) {
          sucursalDisplay = m.cuenta_sucursal_nombre;
        }
      } catch (e) {
        sucursalDisplay = '';
      }

      // Resolver nombre de usuario: preferir `usuario_nombre` que pueda venir del API,
      // si no existe, intentar mapear `user_id` con `usersMap`, si tampoco existe, usar el id.
      const apiUserName = m.usuario_nombre ?? m.usuario_nombre_completo ?? m.user_name ?? null;
      const userId = m.user_id ?? m.usuario ?? m.user ?? m.userId ?? null;
      const usuarioNombreFromMap = userId != null ? (usersMap[String(userId)] ?? '') : '';
      const usuarioNombre = apiUserName || usuarioNombreFromMap || (userId != null ? String(userId) : '');

      return { ...m, __valor: valor, __isIngreso: isIngreso, __rowSaldo: rowSaldo, __cuentaDisplay: cuentaDisplay, __sucursalDisplay: sucursalDisplay, usuario_nombre: usuarioNombre };
    });
  }, [movimientos, saldoActual, cuentas, sucursales, usersMap]);

  // aplicar filtros cliente sobre enrichedMovimientos
  const filteredMovimientos = React.useMemo(() => {
    if (!enrichedMovimientos) return [];
    return enrichedMovimientos.filter(m => {
      // fecha exacta
      if (filtros.fecha) {
        const f = filtros.fecha;
        const mvDate = (m.fecha ?? m.date ?? '').slice(0,10);
        if (mvDate !== f) return false;
      }
      // categoria (substring, case-insensitive)
      if (filtros.categoria) {
        const cat = String(m.categoria ?? m.descripcion ?? '').toLowerCase();
        const want = String(filtros.categoria).toLowerCase();
        if (!cat.includes(want)) return false;
      }
      // tipo (ingreso/egreso)
      if (filtros.tipo) {
        const tipoRaw = String(m.tipo ?? m.tipo_movimiento ?? m.movement_type ?? '').toLowerCase();
        const wantTipo = String(filtros.tipo).toLowerCase();
        if (wantTipo === 'ingreso') {
          if (!(tipoRaw.includes('ing') || tipoRaw.includes('cred'))) return false;
        } else if (wantTipo === 'egreso') {
          if (!(tipoRaw.includes('egre') || tipoRaw.includes('debit'))) return false;
        }
      }
      return true;
    });
  }, [enrichedMovimientos, filtros]);

  const handleVerDetalleMovimiento = (movimiento) => {
    // preferir la versión enriquecida (con __rowSaldo y campos de cuenta)
    const enriched = enrichedMovimientos.find(m => m.id === movimiento.id) || movimiento;
    setMovimientoSeleccionado(enriched);
    setShowDetalleMovimiento(true);
  };

  const handleExportarExcel = () => {
    // Preparar filas en el mismo orden de columnas que se muestran en la UI
    try {
      const rows = (filteredMovimientos || []).map(r => {
        const cuenta = r.__cuentaDisplay ?? (r.cuenta_banco ? `${r.cuenta_banco} - ${r.cuenta_numero}` : (r.cuenta_bancaria ?? r.cuentaBancaria ?? ''));
        const sucursal = r.__sucursalDisplay ?? (r.cuenta_sucursal_nombre ?? r.sucursal ?? '');
        return {
          Fecha: formatDateForExcel(r.fecha ?? r.date ?? ''),
          Categoria: r.categoria ?? r.descripcion ?? '',
          Cuenta: cuenta,
          Partida: r.partida ?? '',
          Sucursal: sucursal,
          Tipo: String(r.tipo ?? r.tipo_movimiento ?? r.movement_type ?? ''),
          Valor: Number(r.__valor ?? r.monto ?? r.valor ?? r.amount ?? 0),
          Saldo: Number(r.__rowSaldo ?? r.saldo ?? 0),
          Referencia: r.referencia ?? '',
          Observaciones: r.observaciones ?? '',
          Descripcion: r.descripcion ?? '',
          Usuario: r.usuario_nombre ?? r.usuario ?? ''
        };
      });

      const prepared = prepareDataForExport(rows, { formatDates: false, formatNumbers: true });
      exportToExcel(prepared, `Banco_Movimientos_${new Date().toISOString().slice(0,10)}`);
    } catch (err) {
      console.error('Error exportando a Excel', err);
      alert('Error exportando a Excel');
    }
  };

  const handleClearFilters = async () => {
    setFiltros({ fecha: '', categoria: '', tipo: '' });
    // refrescar movimientos desde backend para evitar estados inconsistentes
    try {
      const mv = await fetchMovimientosBanco(cuentaSeleccionada);
      setMovimientos(mv?.data || []);
      const s = await fetchSaldoBanco(cuentaSeleccionada);
      setSaldoActual(s?.saldo ?? 0);
    } catch (err) {
      console.error('Error refrescando movimientos al limpiar filtros:', err);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Banco</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevaCuenta(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Cuenta
          </button>
          <button 
            className="btn btn-success"
            onClick={() => setShowNuevoMovimiento(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Movimiento
          </button>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Cuenta</label>
          <select 
            className="form-select"
            value={cuentaSeleccionada}
            onChange={(e) => setCuentaSeleccionada(Number(e.target.value))}
          >
              <option value="">Todas las cuentas</option>
            {cuentas.map(cuenta => (
              <option key={cuenta.id} value={cuenta.id}>
                {getCuentaDisplay(cuenta)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mb-4">
          <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Saldo Actual</h5>
              <h3>{new Intl.NumberFormat('es-CL').format(saldoActual)}</h3>
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
            <div className="col-md-4">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fecha}
                onChange={(e) => setFiltros({...filtros, fecha: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={filtros.categoria}
                onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="deposito">Depósito Bancario</option>
                <option value="transbank">Transbank</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
              >
                <option value="">Todos los tipos</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-outline-secondary me-2" onClick={handleClearFilters}>
              Limpiar filtros
            </button>
            <button className="btn btn-outline-success" onClick={handleExportarExcel}>
              Exportar (CSV)
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Movimientos Bancarios</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Cuenta Bancaria</th>
                  <th>Partida</th>
                  <th>Sucursal</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Saldo</th>
                  <th>Visualizar</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovimientos.map((movimiento) => {
                  const tipoLabel = String(movimiento.tipo ?? movimiento.tipo_movimiento ?? movimiento.movement_type ?? '').toUpperCase();
                  const valor = movimiento.__valor ?? Number(movimiento.monto ?? movimiento.valor ?? movimiento.amount ?? 0);
                  const saldo = movimiento.__rowSaldo ?? 0;
                  const isIngreso = movimiento.__isIngreso;
                  const cuentaNombre = movimiento.__cuentaDisplay ?? (movimiento.cuenta_banco ? `${movimiento.cuenta_banco} - ${movimiento.cuenta_numero}` : (movimiento.cuenta_bancaria ?? movimiento.cuentaBancaria ?? ''));
                  const sucursal = movimiento.__sucursalDisplay ?? (movimiento.cuenta_sucursal_nombre ?? movimiento.sucursal ?? movimiento.cuenta_sucursal ?? '');
                  return (
                    <tr key={movimiento.id}>
                      <td>{movimiento.fecha}</td>
                      <td>{movimiento.categoria ?? movimiento.descripcion ?? ''}</td>
                      <td>{cuentaNombre}</td>
                      <td>{movimiento.partida ?? ''}</td>
                      <td>{sucursal}</td>
                      <td>
                        <span className={`badge bg-${isIngreso ? 'success' : 'danger'}`}>
                          {tipoLabel}
                        </span>
                      </td>
                      <td className={isIngreso ? 'text-success' : 'text-danger'}>
                        {new Intl.NumberFormat('es-CL').format(valor)}
                      </td>
                      <td>{new Intl.NumberFormat('es-CL').format(saldo)}</td>
                      <td className="d-flex gap-1">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalleMovimiento(movimiento)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {/* Si el movimiento proviene de una venta (sintético), no permitir editar/eliminar directo.
                            Mostrar botón 'Conciliar' que prefill el modal para crear un movimiento real. */}
                        {movimiento.__syntheticFromVenta ? (
                          <>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => {
                                // Prellenar datos para crear un movimiento bancario a partir de la venta
                                const v = movimiento.venta_original ?? {};
                                const referencia = movimiento.referencia ?? movimiento.partida ?? v.folioVenta ?? v.folio_venta ?? v.folio ?? v.id ?? '';
                                const inicial = {
                                  fecha: movimiento.fecha ?? v.fecha ?? v.created_at,
                                  descripcion: movimiento.descripcion ?? `Venta ${referencia} - ${v.cliente?.nombre ?? v.cliente ?? ''}`,
                                  tipo: 'INGRESO',
                                  monto: movimiento.monto ?? movimiento.amount ?? Number(v.total ?? v.monto ?? 0),
                                  categoria: movimiento.categoria ?? (v.metodo_pago ?? v.metodoPago ?? v.forma_pago ?? 'Transferencia'),
                                  referencia: referencia,
                                  cuenta: cuentaSeleccionada || undefined,
                                  sucursal: v.sucursal_nombre ?? v.sucursal ?? v.id_sucursal ?? v.sucursal_id ?? undefined,
                                  observaciones: v.observaciones ?? v.observacion ?? ''
                                };
                                setEditMovimiento(inicial);
                                setShowNuevoMovimiento(true);
                              }}
                            >
                              Conciliar
                            </button>
                          </>
                        ) : (movimiento.__fromVentaReal || movimiento.__fromChequeReal) ? (
                          // Movimiento REAL ya generado por venta o por cheque -> no editable ni eliminable desde aquí
                          <>
                            <button className="btn btn-sm btn-secondary" title={movimiento.__fromChequeReal ? "Movimiento generado automáticamente por un cheque; edición deshabilitada" : "Movimiento generado automáticamente por una venta; edición deshabilitada"}>
                              <i className="bi bi-lock-fill"></i>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => { setEditMovimiento(movimiento); setShowNuevoMovimiento(true); }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={async () => {
                                if (!confirm('Confirma eliminar este movimiento?')) return;
                                try {
                                  await deleteMovimientoBanco(movimiento.id);
                                  // recargar la página completa para asegurar estado consistente
                                  window.location.reload();
                                } catch (err) {
                                  console.error('Error eliminando movimiento:', err);
                                }
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNuevaCuenta && (
        <NuevaCuenta 
          sucursales={sucursales}
          onClose={() => setShowNuevaCuenta(false)}
          onSave={async (data) => {
            try {
              const payload = {
                banco: data.banco,
                tipo_cuenta: data.tipoCuenta,
                numero_cuenta: data.numeroCuenta,
                id_sucursal: Number(data.sucursal) || null,
                saldo_inicial: data.saldoInicial,
                observaciones: data.observaciones
              };
              await createCuenta(payload);
              // refrescar cuentas y seleccionar la creada (si la API devuelve la nueva cuenta, mejor)
              const res = await fetchCuentas();
              const c = res?.data || [];
              setCuentas(c);
              if (c.length > 0) setCuentaSeleccionada(c[0].id);
            } catch (err) {
              console.error('Error creando cuenta:', err);
            }
            setShowNuevaCuenta(false);
          }}
        />
      )}

      {showNuevoMovimiento && (
        <NuevoMovimiento 
          cuentas={cuentas}
          sucursales={sucursales}
          initialData={editMovimiento}
          onClose={() => { setShowNuevoMovimiento(false); setEditMovimiento(null); }}
          onSave={async (data) => {
            try {
              const payload = {
                fecha: data.fecha,
                descripcion: data.descripcion,
                tipo: data.tipo,
                monto: Number(data.monto ?? data.valor ?? 0),
                categoria: data.categoria,
                cuenta_id: Number(data.cuenta || cuentaSeleccionada || (cuentas[0]?.id)),
                referencia: data.referencia,
                // preferir enviar id de sucursal si existe, si no enviar nombre
                sucursal: data.sucursal ?? data.sucursal_id ?? data.sucursal_nombre,
                observaciones: data.observaciones
              };
              if (editMovimiento && editMovimiento.id) {
                // actualizar: llamamos al endpoint y luego refrescamos lista completa para mantener saldos consistentes
                try {
                  await updateMovimientoBanco(editMovimiento.id, payload);
                } catch (err) {
                  console.error('Error actualizando movimiento:', err);
                  throw err;
                }
                const mv = await fetchMovimientosBanco(cuentaSeleccionada || (cuentas[0]?.id));
                setMovimientos(mv?.data || []);
              } else {
                const createdRes = await createMovimientoBanco(payload);
                const created = createdRes?.data ?? null;
                if (created) {
                  setMovimientos(prev => [created, ...prev]);
                } else {
                  const mv = await fetchMovimientosBanco(cuentaSeleccionada || (cuentas[0]?.id));
                  setMovimientos(mv?.data || []);
                }
              }
              const s = await fetchSaldoBanco(cuentaSeleccionada || (cuentas[0]?.id));
              setSaldoActual(s?.saldo ?? 0);
            } catch (err) {
              console.error('Error creando/actualizando movimiento banco:', err);
            }
            setShowNuevoMovimiento(false);
            setEditMovimiento(null);
          }}
        />
      )}

      {showDetalleCuenta && (
        <DetalleCuenta 
          cuenta={null}
          onClose={() => setShowDetalleCuenta(false)}
        />
      )}

      {showDetalleMovimiento && movimientoSeleccionado && (
        <DetalleMovimiento 
          movimiento={movimientoSeleccionado}
          onClose={() => {
            setShowDetalleMovimiento(false);
            setMovimientoSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default Banco;