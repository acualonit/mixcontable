import React, { useState } from 'react';
import NuevaCuentaCobrar from '../components/cuentas/NuevaCuentaCobrar';
import DetalleCuentaCobrar from '../components/cuentas/DetalleCuentaCobrar';
import PagoCuentaCobrar from '../components/cuentas/PagoCuentaCobrar';
import HistorialPagos from '../components/cuentas/HistorialPagos';
import CuentasCobrarEliminadas from '../components/cuentas/CuentasCobrarEliminadas';
import { exportToExcel } from '../utils/exportUtils';

function CuentasXCobrar() {
  const [filtros, setFiltros] = useState({
    fecha: '',
    cliente: '',
    documento: '',
    estado: ''
  });
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [showHistorialPagos, setShowHistorialPagos] = useState(false);
  const [showCuentasEliminadas, setShowCuentasEliminadas] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  
  // Estado para almacenar las cuentas (simulado por ahora)
  const [cuentas, setCuentas] = useState([
    {
      id: 1,
      cliente: 'Cliente Ejemplo',
      rut: '12.345.678-9',
      documento: 'Factura Afecta a IVA N° 1234',
      fechaEmision: '2023-12-01',
      fechaVencimiento: '2023-12-31',
      montoTotal: 1500000,
      montoPagado: 500000,
      estado: 'pendiente'
    }
  ]);

  const handleNuevaCuenta = (cuenta) => {
    setCuentas([...cuentas, { ...cuenta, id: cuentas.length + 1 }]);
    setShowNuevaCuenta(false);
  };

  const handleVerDetalle = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    setShowDetalle(true);
  };

  const handleRegistrarPago = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    setShowPago(true);
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
          <button 
            className="btn btn-success"
            onClick={() => setShowNuevaCuenta(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Cuenta
          </button>
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
              const dataToExport = cuentas.map(cuenta => {
                const fechaVencimiento = new Date(cuenta.fechaVencimiento);
                const hoy = new Date();
                const diasMora = fechaVencimiento < hoy ? 
                  Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24)) : 
                  0;

                return {
                  Cliente: cuenta.cliente,
                  RUT: cuenta.rut,
                  Documento: cuenta.documento,
                  'Fecha Emisión': cuenta.fechaEmision,
                  'Fecha Vencimiento': cuenta.fechaVencimiento,
                  'Días Mora': diasMora,
                  'Monto Total': cuenta.montoTotal,
                  'Monto Pagado': cuenta.montoPagado,
                  Saldo: cuenta.montoTotal - cuenta.montoPagado,
                  Estado: diasMora > 0 ? 'Vencida' : 
                          cuenta.montoPagado === cuenta.montoTotal ? 'Pagada' : 
                          'Pendiente'
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
              <h3>$5,000,000</h3>
              <small>10 cuentas pendientes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Cobrado este Mes</h6>
              <h3>$2,500,000</h3>
              <small>5 cuentas cobradas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Por Vencer</h6>
              <h3>$1,500,000</h3>
              <small>3 cuentas próximas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Vencidas</h6>
              <h3>$1,000,000</h3>
              <small>2 cuentas vencidas</small>
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
                {cuentas.map((cuenta) => {
                  const fechaVencimiento = new Date(cuenta.fechaVencimiento);
                  const hoy = new Date();
                  const diasMora = fechaVencimiento < hoy ? 
                    Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24)) : 
                    0;

                  return (
                    <tr key={cuenta.id}>
                      <td>{cuenta.cliente}</td>
                      <td>{cuenta.rut}</td>
                      <td>{cuenta.documento}</td>
                      <td>{cuenta.fechaEmision}</td>
                      <td>{cuenta.fechaVencimiento}</td>
                      <td className={diasMora > 0 ? 'text-danger' : ''}>
                        {diasMora > 0 ? `${diasMora} días` : '-'}
                      </td>
                      <td>${cuenta.montoTotal.toLocaleString()}</td>
                      <td>${cuenta.montoPagado.toLocaleString()}</td>
                      <td className="text-danger">${(cuenta.montoTotal - cuenta.montoPagado).toLocaleString()}</td>
                      <td>
                        <span className={`badge bg-${
                          diasMora > 0 ? 'danger' : 
                          cuenta.montoPagado === cuenta.montoTotal ? 'success' : 
                          'warning'
                        }`}>
                          {diasMora > 0 ? 'Vencida' : 
                           cuenta.montoPagado === cuenta.montoTotal ? 'Pagada' : 
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
                            disabled={cuenta.montoPagado === cuenta.montoTotal}
                          >
                            <i className="bi bi-cash"></i>
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

      {showNuevaCuenta && (
        <NuevaCuentaCobrar 
          onClose={() => setShowNuevaCuenta(false)}
          onSave={handleNuevaCuenta}
        />
      )}

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
            setShowPago(false);
            setCuentaSeleccionada(null);
          }}
          onSave={(pago) => {
            // Aquí iría la lógica para procesar el pago
            console.log('Pago registrado:', pago);
            setShowPago(false);
            setCuentaSeleccionada(null);
          }}
        />
      )}
    </div>
  );
}

export default CuentasXCobrar;