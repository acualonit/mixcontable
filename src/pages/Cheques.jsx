import React, { useState, useEffect } from 'react';
import NuevoCheque from '../components/cheques/NuevoCheque';
import DetalleCheque from '../components/cheques/DetalleCheque';
import { registrarMovimientoBancario } from '../utils/bancoUtils';
import { fetchCheques, cobrarCheque, deleteCheque, fetchCheque } from '../utils/chequesApi';

function Cheques() {
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [bancoFiltro, setBancoFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [showNuevoCheque, setShowNuevoCheque] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [chequeSeleccionado, setChequeSeleccionado] = useState(null);
  const [cheques, setCheques] = useState([]);
  const [editingCheque, setEditingCheque] = useState(null);
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    loadCheques();
    // Cargar cuentas para poblar filtro de banco
    (async () => {
      try {
        const { data } = await import('../utils/bancoApi').then(m => m.fetchCuentas());
        setCuentas(data || []);
      } catch (err) {
        console.error('Error cargando cuentas', err);
      }
    })();
  }, []);

  // Recargar la lista cuando cambien los filtros
  useEffect(() => {
    loadCheques();
  }, [tipoFiltro, estadoFiltro, bancoFiltro, fechaFiltro]);

  const loadCheques = async () => {
    try {
      const filters = {};
      if (tipoFiltro) {
        filters.tipo = tipoFiltro === 'emitidos' ? 'emitido' : (tipoFiltro === 'recibidos' ? 'recibido' : tipoFiltro);
      }
      if (estadoFiltro) filters.estado = estadoFiltro;
      if (bancoFiltro) filters.banco = bancoFiltro;
      if (fechaFiltro) filters.fecha_cobro = fechaFiltro;

      const res = await fetchCheques(filters);
      setCheques(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error cargando cheques');
    }
  };

  const handleCobrarCheque = async (cheque) => {
    try {
      // Registrar el movimiento bancario según el tipo de cheque
      await registrarMovimientoBancario({
        fecha: new Date().toISOString().split('T')[0],
        tipo: cheque.tipo === 'emitido' ? 'egreso' : 'ingreso',
        monto: cheque.monto,
        detalle: `${cheque.tipo === 'emitido' ? 'Cobro de cheque emitido' : 'Cobro de cheque recibido'} N° ${cheque.numero}`,
        banco: cheque.banco,
        referencia: cheque.numero,
        categoria: 'Cheque',
        sucursal: cheque.sucursal
      });

      // Llamar al endpoint para marcar como cobrado
      await cobrarCheque(cheque.id, { fecha_cobro: new Date().toISOString().split('T')[0] });
      await loadCheques();
      console.log('Cheque marcado como cobrado:', cheque);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRestoreCheque = async (cheque) => {
    if (!window.confirm('¿Restaurar este cheque (quitar anulacion)?')) return;
    try {
      // Llamar endpoint de restauración
      await import('../utils/chequesApi').then(m => m.restoreCheque(cheque.id));
      await loadCheques();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error restaurando cheque');
    }
  };

  const handleVerDetalle = async (cheque) => {
    try {
      const res = await fetchCheque(cheque.id);
      setChequeSeleccionado(res.data || cheque);
      setShowDetalle(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error cargando detalle');
    }
  };

  const handleEditar = async (cheque) => {
    if (cheque.estado === 'ANULADO' || cheque.estado === 'ANULADA' || cheque.estado === 'ELIMINADA') return;
    try {
      const res = await fetchCheque(cheque.id);
      setEditingCheque(res.data || cheque);
      setShowNuevoCheque(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error cargando cheque para editar');
    }
  };

  const handleEliminar = async (cheque) => {
    if (!window.confirm('¿Anular/eliminar cheque?')) return;
    try {
      await deleteCheque(cheque.id);
      await loadCheques();
    } catch (err) {
      alert(err.message || 'Error eliminando cheque');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Cheques</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNuevoCheque(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Nuevo Cheque
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-2 mb-3">
              <label className="form-label">Tipo</label>
              <select 
                className="form-select"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="emitidos">Emitidos</option>
                <option value="recibidos">Recibidos</option>
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label">Estado</label>
              <select 
                className="form-select"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Cobrado">Cobrado</option>
                <option value="Rechazado">Rechazado</option>
                <option value="Prestado">Prestado</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Banco</label>
              <select 
                className="form-select"
                value={bancoFiltro}
                onChange={(e) => setBancoFiltro(e.target.value)}
              >
                <option value="">Todos los bancos</option>
                {cuentas.map((ct) => (
                  <option key={ct.id} value={`${ct.banco} - ${ct.numero_cuenta}`}>
                    {`${ct.banco} - ${ct.numero_cuenta}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label">Fecha de Cobro</label>
              <input
                type="date"
                className="form-control"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end mb-3">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setTipoFiltro(''); setEstadoFiltro(''); setBancoFiltro(''); setFechaFiltro(''); }}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Registro de Cheques</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>N° Cheque</th>
                  <th>Tipo</th>
                  <th>Banco</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Cobro</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Origen/Destino</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cheques.map((c) => {
                  const estadoNorm = String(c.estado || '').toLowerCase();
                  // Considerar también registros soft-deleted (deleted_at) como anulados
                  const isSoftDeleted = !!c.deleted_at;
                  const isAnulado = isSoftDeleted || ['anulado', 'anulada', 'eliminada'].includes(estadoNorm);
                  const isRechazado = estadoNorm === 'rechazado';
                  const isCobrado = estadoNorm === 'cobrado';
                  const isPrestado = estadoNorm === 'prestado';
                  const rowClass = isAnulado ? 'table-danger' : (isRechazado ? 'table-warning' : (isPrestado ? 'table-info' : ''));

                  return (
                    <tr key={c.id} className={rowClass}>
                      <td>{c.numero_cheque}</td>
                      <td>{c.tipo ?? (c.estado || '')}</td>
                      <td>{c.cuenta_banco ? `${c.cuenta_banco} - ${c.cuenta_numero ?? ''}` : ''}</td>
                      <td>{c.fecha_emision}</td>
                      <td>{c.fecha_cobro}</td>
                      <td>{c.monto?.toLocaleString ? `$${c.monto.toLocaleString()}` : c.monto}</td>
                      <td>
                        {isRechazado ? (
                          <span className="badge bg-secondary">{c.estado}</span>
                        ) : isCobrado ? (
                          <span className="badge bg-success">{c.estado}</span>
                        ) : isAnulado ? (
                          <span className="badge bg-danger">{c.estado}</span>
                        ) : isPrestado ? (
                          <span className="badge bg-info text-dark">{c.estado}</span>
                        ) : (
                          <span className="badge bg-warning text-dark">{c.estado}</span>
                        )}
                      </td>
                      <td>{c.beneficiario}</td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-primary" onClick={() => handleVerDetalle(c)}>
                                <i className="bi bi-eye"></i>
                              </button>
                              <button className="btn btn-sm btn-warning" onClick={() => handleEditar(c)} disabled={isAnulado || isRechazado}>
                                <i className="bi bi-pencil"></i>
                              </button>
                              {/* Mostrar botón de restaurar (chulo) solo para registros soft-deleted/anulados */}
                              {isAnulado && c.deleted_at ? (
                                <button className="btn btn-sm btn-success" onClick={() => handleRestoreCheque(c)} title="Restaurar">
                                  <i className="bi bi-check-circle"></i>
                                </button>
                              ) : null}
                              <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(c)} disabled={isAnulado}>
                                <i className="bi bi-x-circle"></i>
                              </button>
                            </div>
                          </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNuevoCheque && (
        <NuevoCheque 
          initialData={editingCheque}
          onClose={() => { setShowNuevoCheque(false); setEditingCheque(null); }}
          onSave={async (data) => {
            await loadCheques();
            setShowNuevoCheque(false);
            setEditingCheque(null);
          }}
        />
      )}

      {showDetalle && chequeSeleccionado && (
        <DetalleCheque 
          cheque={chequeSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setChequeSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default Cheques;