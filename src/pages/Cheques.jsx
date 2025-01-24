import React, { useState } from 'react';
import NuevoCheque from '../components/cheques/NuevoCheque';
import DetalleCheque from '../components/cheques/DetalleCheque';
import { registrarMovimientoBancario } from '../utils/bancoUtils';

function Cheques() {
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [bancoFiltro, setBancoFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [showNuevoCheque, setShowNuevoCheque] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [chequeSeleccionado, setChequeSeleccionado] = useState(null);

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

      // Aquí iría la lógica para actualizar el estado del cheque a 'cobrado'
      console.log('Cheque marcado como cobrado:', cheque);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleVerDetalle = (cheque) => {
    setChequeSeleccionado(cheque);
    setShowDetalle(true);
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
            <div className="col-md-3 mb-3">
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
                <option value="protestado">Protestado</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Banco</label>
              <select 
                className="form-select"
                value={bancoFiltro}
                onChange={(e) => setBancoFiltro(e.target.value)}
              >
                <option value="">Todos los bancos</option>
                <option value="banco_estado">Banco Estado</option>
                <option value="banco_chile">Banco de Chile</option>
                <option value="banco_santander">Banco Santander</option>
                <option value="banco_bci">Banco BCI</option>
              </select>
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
                <tr>
                  <td>123456</td>
                  <td>Emitido</td>
                  <td>Banco Estado</td>
                  <td>2023-12-01</td>
                  <td>2023-12-15</td>
                  <td>$1,500,000</td>
                  <td><span className="badge bg-warning">Pendiente</span></td>
                  <td>Proveedor ABC</td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleVerDetalle({
                          numero: '123456',
                          tipo: 'emitido',
                          banco: 'Banco Estado',
                          fechaEmision: '2023-12-01',
                          fechaCobro: '2023-12-15',
                          monto: 1500000,
                          estado: 'pendiente',
                          destinatario: 'Proveedor ABC',
                          sucursal: 'central'
                        })}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-warning">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleCobrarCheque({
                          numero: '123456',
                          tipo: 'emitido',
                          banco: 'Banco Estado',
                          monto: 1500000,
                          sucursal: 'central'
                        })}
                      >
                        <i className="bi bi-check-circle"></i>
                      </button>
                      <button className="btn btn-sm btn-danger">
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNuevoCheque && (
        <NuevoCheque 
          onClose={() => setShowNuevoCheque(false)}
          onSave={(data) => {
            console.log('Nuevo cheque:', data);
            setShowNuevoCheque(false);
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