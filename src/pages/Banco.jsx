import React, { useState } from 'react';
import NuevaCuenta from '../components/banco/NuevaCuenta';
import NuevoMovimiento from '../components/banco/NuevoMovimiento';
import DetalleCuenta from '../components/banco/DetalleCuenta';
import DetalleMovimiento from '../components/banco/DetalleMovimiento';

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

  // Datos de ejemplo para las cuentas
  const [cuentas] = useState([
    {
      id: 1,
      banco: 'Banco Estado',
      numeroCuenta: '123456789',
      saldoActual: 5000000
    }
  ]);

  // Datos de ejemplo para los movimientos
  const [movimientos] = useState([
    {
      id: 1,
      fecha: '2023-12-01',
      tipo: 'ingreso',
      categoria: 'Transferencia',
      descripcion: 'Pago Cliente A',
      cuentaBancaria: 'Banco Estado - 123456789',
      partida: 'Venta',
      sucursal: 'Central',
      valor: 1500000,
      saldo: 5000000,
      referencia: 'TR-001',
      usuario: 'Juan Pérez',
      observaciones: 'Pago factura #1234'
    }
  ]);

  const handleVerDetalleMovimiento = (movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setShowDetalleMovimiento(true);
  };

  const handleExportarExcel = () => {
    // Aquí irá la lógica para exportar a Excel
    console.log('Exportando a Excel...');
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
          <button 
            className="btn btn-light"
            onClick={handleExportarExcel}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Descargar Excel
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
            <option value="">Seleccionar cuenta</option>
            {cuentas.map(cuenta => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.banco} - {cuenta.numeroCuenta}
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
              <h3>${cuentas[0]?.saldoActual.toLocaleString()}</h3>
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
                {movimientos.map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td>{movimiento.fecha}</td>
                    <td>{movimiento.categoria}</td>
                    <td>{movimiento.cuentaBancaria}</td>
                    <td>{movimiento.partida}</td>
                    <td>{movimiento.sucursal}</td>
                    <td>
                      <span className={`badge bg-${movimiento.tipo === 'ingreso' ? 'success' : 'danger'}`}>
                        {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                      </span>
                    </td>
                    <td className={movimiento.tipo === 'ingreso' ? 'text-success' : 'text-danger'}>
                      ${movimiento.valor.toLocaleString()}
                    </td>
                    <td>${movimiento.saldo.toLocaleString()}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleVerDetalleMovimiento(movimiento)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNuevaCuenta && (
        <NuevaCuenta 
          onClose={() => setShowNuevaCuenta(false)}
          onSave={(data) => {
            console.log('Nueva cuenta:', data);
            setShowNuevaCuenta(false);
          }}
        />
      )}

      {showNuevoMovimiento && (
        <NuevoMovimiento 
          cuentas={cuentas}
          onClose={() => setShowNuevoMovimiento(false)}
          onSave={(data) => {
            console.log('Nuevo movimiento:', data);
            setShowNuevoMovimiento(false);
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