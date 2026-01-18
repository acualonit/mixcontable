import React, { useEffect, useMemo, useState } from 'react';
import PagoCuentaPorPagar from '../components/cuentas/PagoCuentaPorPagar';
import HistorialPagosPagar from '../components/cuentas/HistorialPagosPagar';
import CuentasPagarEliminadas from '../components/cuentas/CuentasPagarEliminadas';
import DetalleCuentaPagar from '../components/cuentas/DetalleCuentaPagar';
import { exportToExcel } from '../utils/exportUtils';
import { listVentas } from '../utils/ventasApi';

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
  
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      setCargando(true);
      setErrorCarga('');
      try {
        const res = await listVentas({ metodos_pago: 'Credito (Deuda)', per_page: 500 });
        const ventas = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

        const hoy = new Date();
        const normalizarFecha = (value) => {
          if (!value) return '';
          const s = String(value);
          // soporta 'YYYY-MM-DD' o timestamps
          if (s.length >= 10) return s.slice(0, 10);
          return s;
        };
        const diasEntre = (desde, hasta) => {
          try {
            const d1 = new Date(desde);
            const d2 = new Date(hasta);
            const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
            return Number.isFinite(diff) ? diff : 0;
          } catch {
            return 0;
          }
        };

        const cuentasMap = ventas
          .filter(v => String(v.metodos_pago || '').toLowerCase() === 'credito (deuda)')
          .map(v => {
            const clienteNombre = v?.cliente?.nombre || v?.cliente?.razon_social || v?.cliente_nombre || v?.nombre_cliente || 'Cliente';
            const clienteRut = v?.cliente?.rut || v?.cliente_rut || v?.rut_cliente || '-';
            const fechaEmision = normalizarFecha(v?.fecha || v?.created_at);
            const fechaVencimiento = normalizarFecha(v?.fecha_final || v?.fecha_vencimiento || v?.fechaVencimiento || v?.vencimiento || v?.fecha || v?.created_at);
            const diasMora = fechaVencimiento ? Math.max(0, diasEntre(fechaVencimiento, hoy)) : 0;
            const montoTotal = Number(v?.total || v?.monto_total || v?.monto || 0);

            return {
              origen: 'Venta (Crédito)',
              proveedor: clienteNombre,
              rut: clienteRut,
              documento: `Venta N° ${v?.folioVenta ?? v?.folio ?? v?.id ?? ''}`.trim(),
              fechaEmision,
              fechaVencimiento,
              diasMora,
              montoTotal,
              montoPagado: 0,
              estado: 'pendiente',
              historialPagos: [],
              ventaOriginal: v,
            };
          });

        if (!cancelled) setCuentas(cuentasMap);
      } catch (e) {
        if (!cancelled) setErrorCarga(e?.message || 'Error al cargar cuentas por pagar');
      } finally {
        if (!cancelled) setCargando(false);
      }
    };
    cargar();
    return () => { cancelled = true; };
  }, []);

  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter(c => {
      if (filtros.fecha && c.fechaEmision !== filtros.fecha) return false;
      if (filtros.proveedor && !String(c.proveedor || '').toLowerCase().includes(String(filtros.proveedor).toLowerCase())) return false;
      if (filtros.documento && !String(c.documento || '').toLowerCase().includes(String(filtros.documento).toLowerCase())) return false;
      if (filtros.estado && c.estado !== filtros.estado) return false;
      return true;
    });
  }, [cuentas, filtros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleExportExcel = () => {
    const dataToExport = cuentasFiltradas.map(cuenta => ({
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
              <h3>${cuentasFiltradas.reduce((sum, c) => sum + (c.montoTotal - c.montoPagado), 0).toLocaleString()}</h3>
              <small>{cuentasFiltradas.length} cuentas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Pagado este Mes</h6>
              <h3>${cuentasFiltradas.reduce((sum, c) => sum + c.montoPagado, 0).toLocaleString()}</h3>
              <small>según datos actuales</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Por Vencer</h6>
              <h3>${cuentasFiltradas.filter(c => (c.diasMora || 0) === 0).reduce((sum, c) => sum + (c.montoTotal - c.montoPagado), 0).toLocaleString()}</h3>
              <small>sin mora</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Vencidas</h6>
              <h3>${cuentasFiltradas.filter(c => (c.diasMora || 0) > 0).reduce((sum, c) => sum + (c.montoTotal - c.montoPagado), 0).toLocaleString()}</h3>
              <small>{cuentasFiltradas.filter(c => (c.diasMora || 0) > 0).length} cuentas en mora</small>
            </div>
          </div>
        </div>
      </div>

      {(cargando || errorCarga) && (
        <div className="mb-3">
          {cargando && <div className="alert alert-info mb-0">Cargando cuentas por pagar (ventas Crédito Deuda)...</div>}
          {!cargando && errorCarga && <div className="alert alert-danger mb-0">{errorCarga}</div>}
        </div>
      )}

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
                {cuentasFiltradas.map((cuenta, index) => (
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
                  <td>${cuentasFiltradas.reduce((sum, cuenta) => sum + cuenta.montoTotal, 0).toLocaleString()}</td>
                  <td>${cuentasFiltradas.reduce((sum, cuenta) => sum + cuenta.montoPagado, 0).toLocaleString()}</td>
                  <td className="text-danger">
                    ${cuentasFiltradas.reduce((sum, cuenta) => sum + (cuenta.montoTotal - cuenta.montoPagado), 0).toLocaleString()}
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