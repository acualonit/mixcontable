import React, { useState, useEffect } from 'react';
import NuevoCheque from '../components/cheques/NuevoCheque';
import DetalleCheque from '../components/cheques/DetalleCheque';
import * as chequesApi from '../utils/chequesApi';
import { registrarMovimientoBancario } from '../utils/bancoUtils';

function mapServerToUI(c) {
  return {
    id: c.id,
    numero: c.numero_cheque || c.numeroCheque || c.numero || '',
    tipo: c.tipo || (c.estado === 'EMITIDO' ? 'emitido' : 'recibido'),
    banco: c.banco || c.banco_nombre || '',
    fechaEmision: c.fecha_emision || c.fechaEmision || '',
    fechaCobro: c.fecha_cobro || c.fechaCobro || '',
    monto: c.monto != null ? Number(c.monto) : (c.monto ? Number(c.monto) : 0),
    estado: (c.estado || '').toString().toLowerCase(),
    destinatario: c.beneficiario || c.origenDestino || '',
    observaciones: c.observaciones || c.observacion || '',
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
      if (fechaFiltro) params.fecha = fechaFiltro;
      const data = await chequesApi.fetchCheques(params);
      const list = Array.isArray(data) ? data.map(mapServerToUI) : [];
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

  const handleCobrarCheque = async (cheque) => {
    try {
      // Registrar movimiento bancario (si aplica)
      await registrarMovimientoBancario({
        fecha: new Date().toISOString().split('T')[0],
        tipo: cheque.tipo === 'emitido' ? 'egreso' : 'ingreso',
        monto: cheque.monto,
        detalle: `${cheque.tipo === 'emitido' ? 'Cobro de cheque emitido' : 'Cobro de cheque recibido'} N° ${cheque.numero}`,
        banco: cheque.banco,
        referencia: cheque.numero,
        categoria: 'Cheque',
        sucursal: cheque.sucursal || cheque.raw?.sucursal || ''
      });

      // Marcar como cobrado en servidor (si existe endpoint)
      if (cheque.id) {
        await chequesApi.updateCheque(cheque.id, { estado: 'COBRADO' });
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
        numero_cheque: formData.numeroCheque,
        fecha_emision: formData.fechaEmision,
        fecha_cobro: formData.fechaCobro,
        beneficiario: formData.origenDestino,
        concepto: formData.concepto,
        monto: Number(formData.monto) || 0,
        banco: formData.banco,
        observaciones: formData.observaciones || '',
        estado: formData.tipo === 'emitido' ? 'EMITIDO' : 'RECIBIDO',
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

  const handleAnular = async (cheque) => {
    if (!cheque?.id) return;
    if (!confirm('¿Anular este cheque?')) return;
    try {
      // intentar endpoint específico, si no existe el servidor deberá ignorarlo
      await chequesApi.anularCheque(cheque.id);
      await fetchList();
    } catch (error) {
      // Intentar actualizar estado directamente
      try {
        await chequesApi.updateCheque(cheque.id, { estado: 'ANULADO' });
        await fetchList();
      } catch (e) {
        alert(e.message || 'Error al anular cheque');
      }
    }
  };

  const handleDelete = async (cheque) => {
    if (!cheque?.id) return;
    if (!confirm('¿Eliminar este cheque definitivamente?')) return;
    try {
      await chequesApi.deleteCheque(cheque.id);
      await fetchList();
    } catch (error) {
      alert(error.message || 'Error al eliminar cheque');
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
                <option value="anulado">Anulado</option>
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
                {!loading && cheques.map((c) => (
                  <tr key={c.id || c.numero}>
                    <td>{c.numero}</td>
                    <td>{c.tipo}</td>
                    <td>{c.banco}</td>
                    <td>{c.fechaEmision}</td>
                    <td>{c.fechaCobro}</td>
                    <td>{c.monto ? `$${c.monto.toLocaleString()}` : ''}</td>
                    <td>
                      <span className={`badge bg-${c.estado === 'pendiente' ? 'warning' : c.estado === 'cobrado' ? 'success' : c.estado === 'anulado' ? 'danger' : 'secondary'}`}>
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
                        <button className="btn btn-sm btn-danger" onClick={() => handleAnular(c)} title="Anular">
                          <i className="bi bi-x-circle"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c)} title="Eliminar">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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