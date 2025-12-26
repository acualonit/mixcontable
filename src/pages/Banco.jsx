import React, { useState, useEffect } from 'react';
import NuevaCuenta from '../components/banco/NuevaCuenta';
import NuevoMovimiento from '../components/banco/NuevoMovimiento';
import DetalleCuenta from '../components/banco/DetalleCuenta';
import DetalleMovimiento from '../components/banco/DetalleMovimiento';
import { fetchCuentas, fetchMovimientosBanco, createMovimientoBanco, fetchSaldoBanco, createCuenta, fetchSucursales, deleteMovimientoBanco, updateMovimientoBanco, fetchDeletedMovimientosBanco } from '../utils/bancoApi';
import { exportToExcel, prepareDataForExport, formatDateForExcel } from '../utils/exportUtils';

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
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deletedMovimientos, setDeletedMovimientos] = useState([]);

  const getCuentaDisplay = (cuenta) => {
    if (!cuenta) return '';
    const banco = cuenta.banco ?? cuenta.nombre ?? cuenta.name ?? '';
    const numero = cuenta.numero_cuenta ?? cuenta.numeroCuenta ?? cuenta.numero ?? cuenta.account_number ?? cuenta.numeroCuentaString ?? '';
    if (banco && numero) return `${banco} - ${numero}`;
    if (numero) return numero;
    if (banco) return banco;
    return String(cuenta.id ?? '');
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchCuentas();
        const c = res?.data || [];
        setCuentas(c);
        // por defecto mostrar "Todas las cuentas" (valor vacío)
        setCuentaSeleccionada((prev) => (prev === '' || prev == null ? '' : prev));
        // cargar sucursales
        try {
          const sres = await fetchSucursales();
          setSucursales(sres || sres?.data || []);
        } catch (se) {
          console.warn('No se pudieron cargar sucursales', se);
        }
      } catch (err) {
        console.error('Error cargando cuentas:', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadMov = async () => {
      try {
        const cuentaId = cuentaSeleccionada ? Number(cuentaSeleccionada) : undefined;
        const mv = await fetchMovimientosBanco(cuentaId);
        setMovimientos(mv?.data || []);
        const s = await fetchSaldoBanco(cuentaId);
        setSaldoActual(s?.saldo ?? 0);
      } catch (err) {
        console.error('Error cargando movimientos/saldo:', err);
      }
    };
    loadMov();
  }, [cuentaSeleccionada]);

  // calcular saldos por fila: partiendo del saldoActual y restando/agregando cada movimiento (lista ordenada desc)
  const enrichedMovimientos = React.useMemo(() => {
    let running = Number(saldoActual || 0);
    return (movimientos || []).map(m => {
      const tipoRaw = m.tipo ?? m.tipo_movimiento ?? m.movement_type ?? '';
      const tipoLower = String(tipoRaw).toLowerCase();
      const isIngreso = tipoLower.includes('cred') || tipoLower.includes('ingreso');
      const valor = Number(m.monto ?? m.valor ?? m.amount ?? 0);
      const rowSaldo = running;
      // después de mostrar este movimiento, actualizar running hacia movimientos siguientes (más antiguos)
      running = isIngreso ? running - valor : running + valor;
      return { ...m, __valor: valor, __isIngreso: isIngreso, __rowSaldo: rowSaldo };
    });
  }, [movimientos, saldoActual]);

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
        const cuenta = r.cuenta_banco ? `${r.cuenta_banco} - ${r.cuenta_numero}` : (r.cuenta_bancaria ?? r.cuentaBancaria ?? '');
        const sucursal = r.cuenta_sucursal_nombre ?? r.sucursal ?? '';
        return {
          Fecha: formatDateForExcel(r.fecha ?? r.date ?? ''),
          Categoria: r.categoria ?? r.descripcion ?? '',
          Cuenta: cuenta,
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
            className="btn btn-outline-secondary btn-sm me-2"
            onClick={async () => {
              setShowDeletedModal(true);
              try {
                const res = await fetchDeletedMovimientosBanco();
                setDeletedMovimientos(res?.data || []);
              } catch (e) {
                console.error('Error cargando movimientos eliminados:', e);
                setDeletedMovimientos([]);
              }
            }}
          >
            <i className="bi bi-trash2-fill me-1"></i> Ver Eliminados
          </button>
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
            onChange={(e) => setCuentaSeleccionada(e.target.value)}
          >
              <option value="">Todas las cuentas</option>
            {cuentas.map(cuenta => (
              <option key={cuenta.id} value={String(cuenta.id)}>
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
                  const cuentaNombre = movimiento.cuenta_banco ? `${movimiento.cuenta_banco} - ${movimiento.cuenta_numero}` : (movimiento.cuenta_bancaria ?? movimiento.cuentaBancaria ?? '');
                  const sucursal = movimiento.cuenta_sucursal_nombre ?? movimiento.sucursal ?? movimiento.cuenta_sucursal ?? '';
                  return (
                    <tr key={movimiento.id}>
                      <td>{movimiento.fecha}</td>
                      <td>{movimiento.categoria ?? movimiento.descripcion ?? ''}</td>
                      <td>{cuentaNombre}</td>
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
                              // refrescar lista y saldo
                              const mv = await fetchMovimientosBanco(cuentaSeleccionada);
                              setMovimientos(mv?.data || []);
                              const s = await fetchSaldoBanco(cuentaSeleccionada);
                              setSaldoActual(s?.saldo ?? 0);
                            } catch (err) {
                              console.error('Error eliminando movimiento:', err);
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
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
                id_sucursal: Number(data.sucursal),
                saldo: 0,
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

      {showDeletedModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Movimientos Eliminados</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeletedModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Fecha Eliminación</th>
                        <th>Usuario</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Ver Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedMovimientos.length === 0 && (
                        <tr><td colSpan="5" className="text-center">No hay movimientos eliminados.</td></tr>
                      )}
                      {deletedMovimientos.map(d => {
                        const usuarioShow = d.usuario_nombre ?? d.usuario ?? d.user ?? d.user_id ?? d.userId ?? d.origen ?? '';
                        const tipoRaw = (d.tipo ?? d.tipo_movimiento ?? '').toString();
                        const tipoNorm = tipoRaw.toLowerCase();
                        const isIngreso = tipoNorm.includes('ingreso') || tipoRaw.toUpperCase() === 'INGRESO';
                        return (
                          <tr key={d.id}>
                            <td>{d.deleted_at ?? ''}</td>
                            <td>{usuarioShow || '-'}</td>
                            <td>{isIngreso ? <span className="badge bg-success">Ingreso</span> : <span className="badge bg-danger">Salida</span>}</td>
                            <td className={isIngreso ? 'text-success' : 'text-danger'}>{new Intl.NumberFormat('es-CL').format(d.monto)}</td>
                            <td>
                              <button className="btn btn-sm btn-primary" onClick={() => { setShowDeletedModal(false); setMovimientoSeleccionado(d); setShowDetalleMovimiento(true); }}>
                                Ver Detalle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeletedModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNuevoMovimiento && (
        <NuevoMovimiento 
          cuentas={cuentas}
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
                sucursal: data.sucursal,
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