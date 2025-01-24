import React, { useState } from 'react';
import PagoCuentaPorPagar from '../components/cuentas/PagoCuentaPorPagar';
import HistorialPagosPagar from '../components/cuentas/HistorialPagosPagar';
import CuentasPagarEliminadas from '../components/cuentas/CuentasPagarEliminadas';
import DetalleCuentaPagar from '../components/cuentas/DetalleCuentaPagar';
import { exportToExcel } from '../utils/exportUtils';

function CuentasXPagar() {
  const [filtros, setFiltros] = useState({
    fecha: '',
    proveedor: '',
    documento: '',
    estado: ''
  });
  const [showPago, setShowPago] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showHistorialPagos, setShowHistorialPagos] = useState(false);
  const [showCuentasEliminadas, setShowCuentasEliminadas] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  
  // Agregamos el estado para las cuentas
  const [cuentas] = useState([
    {
      origen: 'Compra Insumos',
      proveedor: 'Proveedor A',
      rut: '76.543.210-K',
      documento: 'Factura Afecta a IVA N° 001',
      fechaEmision: '2023-12-01',
      fechaVencimiento: '2023-12-15',
      diasMora: 5,
      montoTotal: 1500000,
      montoPagado: 500000,
      estado: 'pendiente',
      historialPagos: [
        {
          fecha: '2023-12-05',
          monto: 500000,
          metodoPago: 'Transferencia',
          comprobante: 'TR-001',
          usuario: 'Juan Pérez'
        }
      ]
    },
    {
      origen: 'Gastos',
      proveedor: 'Proveedor B',
      rut: '77.654.321-0',
      documento: 'Factura Afecta a IVA N° 002',
      fechaEmision: '2023-12-05',
      fechaVencimiento: '2023-12-20',
      diasMora: 0,
      montoTotal: 800000,
      montoPagado: 0,
      estado: 'pendiente',
      historialPagos: []
    }
  ]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleExportExcel = () => {
    const dataToExport = cuentas.map(cuenta => ({
      Origen: cuenta.origen,
      Proveedor: cuenta.proveedor,
      RUT: cuenta.rut,
      Documento: cuenta.documento,
      'Fecha Emisión': cuenta.fechaEmision,
      'Fecha Vencimiento': cuenta.fechaVencimiento,
      'Días Mora': cuenta.diasMora || 0,
      'Monto Total': cuenta.montoTotal,
      'Monto Pagado': cuenta.montoPagado,
      Saldo: cuenta.montoTotal - cuenta.montoPagado,
      Estado: cuenta.estado
    }));

    exportToExcel(dataToExport, 'CuentasPorPagar');
  };

  if (showHistorialPagos) {
    return <HistorialPagosPagar onBack={() => setShowHistorialPagos(false)} />;
  }

  if (showCuentasEliminadas) {
    return <CuentasPagarEliminadas onBack={() => setShowCuentasEliminadas(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Cuentas por Pagar</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowHistorialPagos(true)}
          >
            <i className="bi bi-clock-history me-2"></i>
            Historial de Pagos
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => setShowCuentasEliminadas(true)}
          >
            <i className="bi bi-trash me-2"></i>
            Cuentas Eliminadas
          </button>
          <button 
            className="btn btn-success"
            onClick={handleExportExcel}
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
              <label className="form-label">Proveedor</label>
              <input
                type="text"
                className="form-control"
                value={filtros.proveedor}
                onChange={(e) => handleFiltroChange('proveedor', e.target.value)}
                placeholder="Buscar por proveedor..."
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
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Total por Pagar</h6>
              <h3>$8,000,000</h3>
              <small>15 cuentas pendientes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Pagado este Mes</h6>
              <h3>$3,500,000</h3>
              <small>8 cuentas pagadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Por Vencer</h6>
              <h3>$2,500,000</h3>
              <small>5 cuentas próximas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Vencidas</h6>
              <h3>$2,000,000</h3>
              <small>2 cuentas vencidas</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">Cuentas por Pagar</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Origen</th>
                  <th>Proveedor</th>
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
                {cuentas.map((cuenta, index) => (
                  <tr key={index}>
                    <td>{cuenta.origen}</td>
                    <td>{cuenta.proveedor}</td>
                    <td>{cuenta.rut}</td>
                    <td>{cuenta.documento}</td>
                    <td>{cuenta.fechaEmision}</td>
                    <td>{cuenta.fechaVencimiento}</td>
                    <td className={cuenta.diasMora > 0 ? 'text-danger' : ''}>
                      {cuenta.diasMora > 0 ? `${cuenta.diasMora} días` : '-'}
                    </td>
                    <td>${cuenta.montoTotal.toLocaleString()}</td>
                    <td>${cuenta.montoPagado.toLocaleString()}</td>
                    <td className="text-danger">
                      ${(cuenta.montoTotal - cuenta.montoPagado).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge bg-warning">
                        {cuenta.estado.charAt(0).toUpperCase() + cuenta.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setCuentaSeleccionada(cuenta);
                            setShowDetalle(true);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            setCuentaSeleccionada({
                              proveedor: cuenta.proveedor,
                              documento: cuenta.documento,
                              monto: cuenta.montoTotal - cuenta.montoPagado
                            });
                            setShowPago(true);
                          }}
                        >
                          <i className="bi bi-cash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="7">TOTAL</td>
                  <td>${cuentas.reduce((sum, cuenta) => sum + cuenta.montoTotal, 0).toLocaleString()}</td>
                  <td>${cuentas.reduce((sum, cuenta) => sum + cuenta.montoPagado, 0).toLocaleString()}</td>
                  <td className="text-danger">
                    ${cuentas.reduce((sum, cuenta) => sum + (cuenta.montoTotal - cuenta.montoPagado), 0).toLocaleString()}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {showPago && cuentaSeleccionada && (
        <PagoCuentaPorPagar
          cuenta={cuentaSeleccionada}
          onClose={() => {
            setShowPago(false);
            setCuentaSeleccionada(null);
          }}
          onSave={(pago) => {
            console.log('Pago registrado:', pago);
            setShowPago(false);
            setCuentaSeleccionada(null);
          }}
        />
      )}

      {showDetalle && cuentaSeleccionada && (
        <DetalleCuentaPagar
          cuenta={cuentaSeleccionada}
          onClose={() => {
            setShowDetalle(false);
            setCuentaSeleccionada(null);
          }}
        />
      )}
    </div>
  );
}

export default CuentasXPagar;