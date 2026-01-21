import React, { useState, useEffect } from 'react';
import NuevoCheque from '../components/cheques/NuevoCheque';
import DetalleCheque from '../components/cheques/DetalleCheque';
import * as chequesApi from '../utils/chequesApi';
import { registrarMovimientoBancario } from '../utils/bancoUtils';

function mapServerToUI(c) {
  const bancoFromCuenta = c.cuenta_banco && c.cuenta_numero ? `${c.cuenta_banco} - ${c.cuenta_numero}` : (c.cuenta_banco || c.cuenta_numero || '');
  const tipoKey = (c.tipo || '').toString().toLowerCase();
  const estadoKey = (c.estado || '').toString().toLowerCase();
  const usuario = c.usuario_nombre || c.usuario_username || c.usuario_email || c.usuario || c.user || '';

  return {
    id: c.id,
    numero: c.numero_cheque || c.numeroCheque || c.numero || '',
    tipo: tipoKey.includes('recib') ? 'recibido' : 'emitido',
    banco: bancoFromCuenta || c.banco || c.banco_nombre || '',
    fechaEmision: c.fecha_emision || c.fechaEmision || '',
    fechaCobro: c.fecha_cobro || c.fechaCobro || '',
    monto: c.monto != null ? Number(c.monto) : (c.monto ? Number(c.monto) : 0),
    estado: estadoKey,
    destinatario: c.beneficiario || c.origenDestino || '',
    observaciones: c.observaciones || c.observacion || '',
    usuario,
    raw: c,
  };
}

function Cheques() {
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [bancoFiltro, setBancoFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [showNuevoCheque, setShowNuevoCheque] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [chequeSeleccionado, setChequeSeleccionado] = useState(null);
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tipoFiltro) params.tipo = tipoFiltro;
      if (estadoFiltro) params.estado = estadoFiltro;
      if (bancoFiltro) params.banco = bancoFiltro;
      if (fechaFiltro) params.fecha_cobro = fechaFiltro;
      const data = await chequesApi.fetchCheques(params);
      const list = Array.isArray(data) ? data.map(mapServerToUI) : (Array.isArray(data?.data) ? data.data.map(mapServerToUI) : []);
      setCheques(list);
    } catch (error) {
      console.error('Error cargando cheques', error);
      alert(error.message || 'Error al cargar cheques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const isChequeFromVenta = (cheque) => {
    const obs = (cheque?.observaciones ?? cheque?.raw?.observaciones ?? '').toString().toLowerCase();
    return obs.includes('origen:venta');
  };

  const handleCobrarCheque = async (cheque) => {
    try {
      // El movimiento bancario se crea/reactiva en el backend al cobrar el cheque.
      if (cheque.id) {
        await chequesApi.cobrarCheque(cheque.id, { fecha_cobro: new Date().toISOString().slice(0, 10) });
      }
      await fetchList();
    } catch (error) {
      alert(error.message || 'Error al cobrar cheque');
    }
  };

  const handleVerDetalle = (cheque) => {
    setChequeSeleccionado(cheque);
    setShowDetalle(true);
  };

  const handleOpenNuevo = (initial = null) => {
    setEditing(initial);
    setShowNuevoCheque(true);
  };

  const handleSave = async (formData) => {
    try {
      // Mapear campos del formulario al payload esperado por el servidor
      const payload = {
        cuenta_id: formData.cuenta_id ? Number(formData.cuenta_id) : null,
        numero_cheque: formData.numeroCheque,
        tipo: formData.tipo || (tipoFiltro || 'emitido'),
        fecha_emision: formData.fechaEmision,
        fecha_cobro: formData.fechaCobro || null,
        beneficiario: formData.origenDestino,
        concepto: formData.concepto,
        monto: Number(formData.monto) || 0,
        observaciones: formData.observaciones || '',
        estado: String(formData.estado || 'Pendiente'),
      };

      if (formData.id) {
        await chequesApi.updateCheque(formData.id, payload);
      } else {
        await chequesApi.createCheque(payload);
      }
      setShowNuevoCheque(false);
      setEditing(null);
      await fetchList();
    } catch (error) {
      console.error('Error guardando cheque', error);
      alert(error.message || 'Error al guardar cheque');
    }
  };

  const handleRechazar = async (cheque) => {
    if (!cheque?.id) return;
    if (!confirm('¿Marcar este cheque como Rechazado?')) return;
    try {
      await chequesApi.updateCheque(cheque.id, { estado: 'Rechazado' });
      await fetchList();
    } catch (e) {
      alert(e.message || 'Error al rechazar cheque');
    }
  };

  const handleDelete = async (cheque) => {
    if (!cheque?.id) return;

    if (isChequeFromVenta(cheque)) {
      alert('Este cheque proviene de una venta y no se puede eliminar desde este módulo. Debe gestionarse desde Ventas (solo si está Pendiente).');
      return;
    }

    if (!confirm('¿Eliminar este cheque definitivamente?')) return;
    try {
      await chequesApi.deleteCheque(cheque.id);
      await fetchList();
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Error al eliminar cheque';
      alert(msg);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Cheques</h2>
        <button 
          className="btn btn-primary"
          onClick={() => handleOpenNuevo(null)}
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
            <div className="col-md-3 mb-3">
              <label className="form-label">Tipo</label>
              <select 
                className="form-select"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="emitido">Emitidos</option>
                <option value="recibido">Recibidos</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Estado</label>
              <select 
                className="form-select"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="cobrado">Cobrado</option>
                <option value="rechazado">Rechazado</option>
                <option value="prestado">Prestado</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Banco</label>
              <input
                className="form-control"
                value={bancoFiltro}
                onChange={(e) => setBancoFiltro(e.target.value)}
                placeholder="Filtrar por banco"
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Fecha de Cobro</label>
              <input
                type="date"
                className="form-control"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
              />
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchList}>Aplicar</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setTipoFiltro(''); setEstadoFiltro(''); setBancoFiltro(''); setFechaFiltro(''); fetchList(); }}>Limpiar</button>
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
                {loading && (
                  <tr><td colSpan="9">Cargando...</td></tr>
                )}
                {!loading && cheques.length === 0 && (
                  <tr><td colSpan="9">No hay cheques</td></tr>
                )}
                {!loading && cheques.map((c) => {
                  const fromVenta = isChequeFromVenta(c);
                  return (
                    <tr key={c.id || c.numero}>
                      <td>{c.numero}</td>
                      <td>{c.tipo}</td>
                      <td>{c.banco}</td>
                      <td>{c.fechaEmision}</td>
                      <td>{c.fechaCobro}</td>
                      <td>{c.monto ? `$${c.monto.toLocaleString()}` : ''}</td>
                      <td>
                        <span className={`badge bg-${c.estado === 'pendiente' ? 'warning' : c.estado === 'cobrado' ? 'success' : c.estado === 'rechazado' ? 'danger' : c.estado === 'prestado' ? 'info' : 'secondary'}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td>{c.destinatario}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-primary" onClick={() => handleVerDetalle(c)}>
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-warning" onClick={() => handleOpenNuevo(c.raw)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-success" onClick={() => handleCobrarCheque(c)}>
                            <i className="bi bi-check-circle"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleRechazar(c)} title="Rechazar">
                            <i className="bi bi-x-circle"></i>
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(c)}
                            title={fromVenta ? 'No eliminable: proviene de venta' : 'Eliminar'}
                            disabled={fromVenta}
                          >
                            <i className="bi bi-trash"></i>
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
          initialData={editing}
          onClose={() => { setShowNuevoCheque(false); setEditing(null); }}
          onSave={handleSave}
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