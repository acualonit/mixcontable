import React, { useState, useEffect } from 'react';
import { fetchSaldo, fetchMovimientos, createMovimiento, updateMovimiento, deleteMovimiento, fetchDeletedMovimientos } from '../utils/efectivoApi';

function Efectivo() {
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    fecha: new Date().toISOString().split('T')[0],
    valor: '',
    detalle: '',
    tipo: 'ingreso'
  });
  const [editingId, setEditingId] = useState(null);
  const [showViewMovimiento, setShowViewMovimiento] = useState(false);
  const [viewMovimiento, setViewMovimiento] = useState(null);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deletedMovimientos, setDeletedMovimientos] = useState([]);
  const [saldo, setSaldo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const s = await fetchSaldo();
        setSaldo(s?.saldo ?? 0);
        const mv = await fetchMovimientos();
        setMovimientos(mv?.data || []);
        // cargar usuarios para mostrar nombres cuando el campo contiene un id
        try {
          const u = await fetchUsuarios();
          const map = {};
          (u?.users || u?.data || []).forEach(x => {
            map[String(x.id)] = x.name ?? x.username ?? `${x.name ?? ''}`;
          });
          setUsersMap(map);
        } catch (err) {
          // ignore users load error
          setUsersMap({});
        }
      } catch (err) {
        console.error('Error cargando efectivo:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí irá la lógica para guardar el movimiento
    (async () => {
      try {
        const payload = {
          fecha: nuevoMovimiento.fecha,
          detalle: nuevoMovimiento.detalle,
          tipo: nuevoMovimiento.tipo,
          monto: parseFloat(nuevoMovimiento.valor),
          caja_id: 1
        };
        if (editingId) {
          await updateMovimiento(editingId, payload);
        } else {
          await createMovimiento(payload);
        }
        // recargar datos
        const s = await fetchSaldo();
        setSaldo(s?.saldo ?? 0);
        const mv = await fetchMovimientos();
        setMovimientos(mv?.data || []);
        setShowNuevoMovimiento(false);
        setNuevoMovimiento({ fecha: new Date().toISOString().split('T')[0], valor: '', detalle: '', tipo: 'ingreso' });
        setEditingId(null);
      } catch (err) {
        console.error('Error guardando movimiento:', err);
        alert(err.message || 'Error guardando movimiento');
      }
    })();
  };

  const handleEdit = (m) => {
    setEditingId(m.id);
    setNuevoMovimiento({
      fecha: m.fecha,
      valor: m.monto,
      detalle: m.detalle ?? m.descripcion ?? '',
      tipo: (m.tipo ?? m.tipo_movimiento ?? '').toString().toLowerCase().includes('ingreso') ? 'ingreso' : 'egreso'
    });
    setShowNuevoMovimiento(true);
  };

  const handleDelete = async (m) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try {
      await deleteMovimiento(m.id);
      const s = await fetchSaldo();
      setSaldo(s?.saldo ?? 0);
      const mv = await fetchMovimientos();
      setMovimientos(mv?.data || []);
    } catch (err) {
      console.error('Error eliminando movimiento:', err);
      alert(err.message || 'Error eliminando movimiento');
    }
  };

  const handleShow = (m) => {
    setViewMovimiento(m);
    setShowViewMovimiento(true);
  };

  // Filtrado y cálculo de saldo acumulado (running balance) para la tabla
  const computeFilteredAndTotals = () => {
    const filtered = movimientos.filter(m => {
      const raw = filtroFecha ?? '';
      const f = raw.toString().trim();
      // tratar placeholders o textos como vacíos
      if (!f || f.toLowerCase().includes('dd') || f.toLowerCase().includes('mm') || f.toLowerCase().includes('aaaa')) return true;
      // input date devuelve yyyy-mm-dd; asegurarse de comparar en ISO
      // si usuario ingresó en formato dd/mm/yyyy, convertirlo
      let want = f;
      if (f.includes('/')) {
        const parts = f.split('/');
        if (parts.length === 3) {
          // dd/mm/yyyy -> yyyy-mm-dd
          want = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        }
      }
      return (m.fecha || '').toString().startsWith(want);
    });

    let running = 0;
    const rows = filtered.map((m) => {
      const detalle = m.detalle ?? m.descripcion ?? m.description ?? '';
      const tipoRaw = (m.tipo ?? m.tipo_movimiento ?? m.movement_type ?? '').toString();
      const tipoNorm = tipoRaw.toLowerCase();
      const isIngreso = tipoNorm.includes('ingreso') || tipoRaw.toUpperCase() === 'INGRESO';
        const usuarioShow = m.usuario_nombre ?? m.usuario ?? m.user ?? m.user_id ?? m.userId ?? m.origen ?? '';
      const monto = Number(m.monto) || 0;
      running = isIngreso ? running + monto : running - monto;
      return { row: m, detalle, isIngreso, usuarioShow, monto, running };
    });

    const totalMonto = rows.reduce((s, r) => s + (Number(r.monto) || 0), 0);
    const totalAcumulado = rows.length ? rows[rows.length - 1].running : 0;
    return { filteredRows: rows, totalMonto, totalAcumulado };
  };

  const { filteredRows, totalMonto, totalAcumulado } = computeFilteredAndTotals();

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Control de Efectivo</h2>
        <div>
          <button 
            className="btn btn-outline-secondary btn-sm me-2"
            onClick={async () => {
              setShowDeletedModal(true);
              try {
                const res = await fetchDeletedMovimientos();
                setDeletedMovimientos(res?.data || []);
              } catch (e) {
                console.error('Error cargando eliminados', e);
                setDeletedMovimientos([]);
              }
            }}
          >
            <i className="bi bi-trash2-fill me-1"></i> Ver Eliminados
          </button>
          <button 
            className="btn btn-primary btn-sm px-3 py-2"
            onClick={() => setShowNuevoMovimiento(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Movimiento
          </button>
        </div>
      </div>
      {showViewMovimiento && viewMovimiento && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-secondary text-white">
                <h5 className="modal-title">Detalle Movimiento</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewMovimiento(false)}></button>
              </div>
              <div className="modal-body">
                <dl className="row">
                  <dt className="col-sm-4">Fecha</dt>
                  <dd className="col-sm-8">{viewMovimiento.fecha}</dd>

                  <dt className="col-sm-4">Detalle</dt>
                  <dd className="col-sm-8">{viewMovimiento.detalle ?? viewMovimiento.descripcion ?? ''}</dd>

                  <dt className="col-sm-4">Tipo</dt>
                  <dd className="col-sm-8">{(viewMovimiento.tipo ?? viewMovimiento.tipo_movimiento ?? '').toString()}</dd>

                  <dt className="col-sm-4">Monto</dt>
                  <dd className="col-sm-8">{new Intl.NumberFormat('es-CL').format(viewMovimiento.monto)}</dd>

                  <dt className="col-sm-4">Sucursal</dt>
                  <dd className="col-sm-8">{viewMovimiento.sucursal ?? ''}</dd>

                  <dt className="col-sm-4">Usuario</dt>
                  <dd className="col-sm-8">{(viewMovimiento.usuario_nombre ?? (usersMap[String(viewMovimiento.user_id ?? viewMovimiento.userId ?? viewMovimiento.usuario ?? viewMovimiento.user ?? viewMovimiento.origen)] ?? viewMovimiento.usuario ?? viewMovimiento.user ?? viewMovimiento.origen ?? ''))}</dd>
                </dl>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewMovimiento(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
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
                        let displayDeletedUser = usuarioShow ?? '';
                        if (displayDeletedUser && /^[0-9]+$/.test(displayDeletedUser) && usersMap[String(displayDeletedUser)]) {
                          displayDeletedUser = usersMap[String(displayDeletedUser)];
                        }
                        if (!displayDeletedUser) displayDeletedUser = '-';
                        const tipoRaw = (d.tipo ?? d.tipo_movimiento ?? '').toString();
                        const tipoNorm = tipoRaw.toLowerCase();
                        const isIngreso = tipoNorm.includes('ingreso') || tipoRaw.toUpperCase() === 'INGRESO';
                        return (
                          <tr key={d.id}>
                            <td>{d.deleted_at ?? ''}</td>
                            <td>{displayDeletedUser}</td>
                            <td>{isIngreso ? <span className="badge bg-success">Ingreso</span> : <span className="badge bg-danger">Salida</span>}</td>
                            <td className={isIngreso ? 'text-success' : 'text-danger'}>{new Intl.NumberFormat('es-CL').format(d.monto)}</td>
                            <td>
                              <button className="btn btn-sm btn-primary" onClick={() => { setShowDeletedModal(false); setViewMovimiento(d); setShowViewMovimiento(true); }}>
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
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Saldo Actual</h5>
              <h3>{loading ? 'Cargando...' : new Intl.NumberFormat('es-CL').format(saldo ?? 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* El resto del código permanece igual */}
      {showNuevoMovimiento && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Nuevo Movimiento de Efectivo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNuevoMovimiento(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={nuevoMovimiento.fecha}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        fecha: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Valor</label>
                    <input
                      type="number"
                      className="form-control"
                      value={nuevoMovimiento.valor}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        valor: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Detalle</label>
                    <textarea
                      className="form-control"
                      value={nuevoMovimiento.detalle}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        detalle: e.target.value
                      })}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-select"
                      value={nuevoMovimiento.tipo}
                      onChange={(e) => setNuevoMovimiento({
                        ...nuevoMovimiento,
                        tipo: e.target.value
                      })}
                      required
                    >
                      <option value="ingreso">Ingreso de Efectivo</option>
                      <option value="egreso">Salida de Efectivo</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowNuevoMovimiento(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header bg-light">
          <div className="row align-items-center">
            <div className="col-md-4">
              <label className="form-label mb-0">Filtrar por fecha:</label>
              <div className="d-flex">
                <input
                  type="date"
                  className="form-control"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                />
                <button type="button" className="btn btn-outline-secondary ms-2 btn-sm" onClick={() => setFiltroFecha('')} title="Limpiar filtro">Limpiar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-secondary text-white">
          <h5 className="card-title mb-0">Movimientos de Efectivo</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Detalle</th>
                  <th>Tipo de Movimiento</th>
                  <th>Categoría</th>
                  <th>Sucursal</th>
                  <th>Monto</th>
                  <th>Saldo</th>
                  <th>Usuario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center">No hay movimientos.</td>
                  </tr>
                )}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">No hay movimientos.</td>
                  </tr>
                ) : (
                  filteredRows.map(({ row: m, detalle, isIngreso, usuarioShow, monto, running }) => {
                    // resolver usuario si es id
                    let displayUser = usuarioShow ?? '';
                    if (displayUser && /^[0-9]+$/.test(displayUser) && usersMap[String(displayUser)]) {
                      displayUser = usersMap[String(displayUser)];
                    }
                    if (!displayUser) displayUser = '-';
                    return (
                      <tr key={m.id}>
                        <td>{m.fecha}</td>
                        <td>{detalle}</td>
                        <td>{isIngreso ? <span className="badge bg-success">Ingreso</span> : <span className="badge bg-danger">Egreso</span>}</td>
                        <td>{m.categoria ?? ''}</td>
                        <td>{m.sucursal ?? ''}</td>
                        <td className={isIngreso ? 'text-success' : 'text-danger'}>{new Intl.NumberFormat('es-CL').format(monto)}</td>
                        <td className={running >= 0 ? 'text-success' : 'text-danger'}>{new Intl.NumberFormat('es-CL').format(running)}</td>
                        <td>{displayUser}</td>
                        <td>
                          <button className="btn btn-sm btn-primary me-1" onClick={() => handleShow(m)} title="Ver">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-secondary me-1" onClick={() => handleEdit(m)} title="Editar">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m)} title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="6">TOTAL</td>
                  <td>{new Intl.NumberFormat('es-CL').format(totalAcumulado)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Efectivo;