import React, { useState, useEffect } from 'react';
import NuevaVenta from '../components/ventas/NuevaVenta';
import DetalleVenta from '../components/ventas/DetalleVenta';
import VentasDiarias from '../components/ventas/VentasDiarias';
import VentasEliminadas from '../components/ventas/VentasEliminadas';
import VentaMasiva from '../components/ventas/VentaMasiva';
import ventasApi from '../utils/ventasApi';
import { fetchEmpresas, fetchSucursales } from '../utils/configApi';

function Ventas() {
  const [filtros, setFiltros] = useState({
    fecha: '',
    sucursal: '',
    metodoPago: ''
  });
  const [showNuevaVenta, setShowNuevaVenta] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showVentasDiarias, setShowVentasDiarias] = useState(false);
  const [showVentasEliminadas, setShowVentasEliminadas] = useState(false);
  const [showVentaMasiva, setShowVentaMasiva] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const handleNuevaVenta = () => {
    setShowNuevaVenta(true);
  };

  const [ventasList, setVentasList] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const empresasRes = await fetchEmpresas();
        const empresa = Array.isArray(empresasRes) ? empresasRes[0] : (empresasRes?.data ? empresasRes.data[0] : null);
        if (!empresa) {
          if (mounted) setSucursales([]);
          return;
        }
        const sucursalesRes = await fetchSucursales(empresa.id);
        if (!mounted) return;
        const list = Array.isArray(sucursalesRes) ? sucursalesRes : (sucursalesRes?.data ?? []);
        setSucursales(list || []);
      } catch (err) {
        console.error('Error cargando sucursales:', err);
        if (mounted) setSucursales([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar ventas inicialmente al montar la página
  useEffect(() => {
    handleBuscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerDia = (fecha) => {
    setFechaSeleccionada(fecha);
    setShowVentasDiarias(true);
  };

  const handleVerDetalle = (venta) => {
    setVentaSeleccionada(venta);
    setShowDetalle(true);
  };

  const handleGuardarVenta = (ventaData) => {
    // Guardar en backend
    ventasApi.createVenta(ventaData)
      .then(res => {
        alert('Venta guardada');
        setShowNuevaVenta(false);
        handleBuscar();
      })
      .catch(err => {
        console.error(err);
        alert(err.message || 'Error al guardar la venta');
      });
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleExportExcel = () => {
    ventasApi.exportVentas(filtros)
      .catch(err => {
        console.error(err);
        alert('Error al exportar');
      });
  };

  const handleBuscar = () => {
    // Construir parámetros y añadir alias por compatibilidad con backend
    const params = {};
    if (filtros.fecha) params.fecha = filtros.fecha;
    if (filtros.sucursal) params.sucursal = filtros.sucursal;
    if (filtros.metodoPago) {
      // enviar ambos nombres: camelCase y snake_case, en caso que el backend
      // espere `metodos_pago` o `metodoPago`.
      params.metodoPago = filtros.metodoPago;
      params.metodos_pago = filtros.metodoPago;
    }

    console.debug('Buscando ventas con parámetros:', params);

    ventasApi.listVentas(params)
      .then(res => {
        setVentasList(res.data || []);
      })
      .catch(err => {
        console.error('Error fetching ventas:', err);
        alert('Error al obtener ventas');
      });
  };

  const handleClearFilters = () => {
    setFiltros({ fecha: '', sucursal: '', metodoPago: '' });
    // recargar sin filtros
    setTimeout(() => handleBuscar(), 0);
  };

  const formatDate = (iso) => {
    try {
      if (!iso) return '';
      // Si ya es un objeto Date
      if (iso instanceof Date) {
        return iso.toLocaleDateString('es-CL');
      }
      // Detectar formato YYYY-MM-DD (sin hora/zonas) y crear fecha en zona local
      if (typeof iso === 'string') {
        // Extraer la porción de fecha YYYY-MM-DD incluso si vienen hora, milisegundos o zona
        const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          const y = Number(m[1]);
          const mo = Number(m[2]) - 1;
          const d = Number(m[3]);
          // Crear fecha en zona local usando sólo año/mes/día para que coincida con DB
          return new Date(y, mo, d).toLocaleDateString('es-CL');
        }
      }
      const d = new Date(iso);
      if (isNaN(d)) return iso;
      return d.toLocaleDateString('es-CL');
    } catch (e) {
      return iso;
    }
  };

  const totals = React.useMemo(() => {
    const t = {
      efectivo: 0,
      transferencia: 0,
      tDebito: 0,
      tCredito: 0,
      cheque: 0,
      online: 0,
      creditoDeuda: 0,
      otros: 0,
      totalVenta: 0,
      deuda: 0,
    };
    ventasList.forEach(v => {
      const amt = Number(v.total) || 0;
      const mp = v.metodos_pago || (typeof v.metodos_pago === 'string' ? v.metodos_pago : null);
      switch ((mp || '').toString()) {
        case 'Efectivo':
          t.efectivo += amt; break;
        case 'Transferencia':
          t.transferencia += amt; break;
        case 'Tarejeta Debito':
        case 'Tarjeta Debito':
          t.tDebito += amt; break;
        case 'Tarjeta Credito':
          t.tCredito += amt; break;
        case 'Cheque':
          t.cheque += amt; break;
        case 'Pago Online':
          t.online += amt; break;
        case 'Credito (Deuda)':
          t.creditoDeuda += amt; t.deuda += amt; break;
        default:
          t.otros += amt; break;
      }
      t.totalVenta += amt;
    });
    return t;
  }, [ventasList]);

  if (showVentasDiarias) {
    return (
      <VentasDiarias 
        fecha={fechaSeleccionada}
        onBack={() => setShowVentasDiarias(false)}
      />
    );
  }

  if (showVentasEliminadas) {
    return (
      <VentasEliminadas
        onBack={() => setShowVentasEliminadas(false)}
      />
    );
  }

  if (showVentaMasiva) {
    return (
      <VentaMasiva
        onBack={() => setShowVentaMasiva(false)}
      />
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Ventas</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={handleNuevaVenta}>
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Venta
          </button>
          <button className="btn btn-primary" onClick={() => setShowVentaMasiva(true)}>
            <i className="bi bi-file-earmark-plus me-2"></i>
            Agregar Venta Masiva
          </button>
          <button className="btn btn-warning" onClick={() => setShowVentasEliminadas(true)}>
            <i className="bi bi-trash me-2"></i>
            Historial de Ventas Eliminadas
          </button>
          <button className="btn btn-info" onClick={handleExportExcel}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Descargar Excel
          </button>
        </div>
      </div>
      
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
              <label className="form-label">Sucursal</label>
              <select 
                className="form-select"
                value={filtros.sucursal}
                onChange={(e) => handleFiltroChange('sucursal', e.target.value)}
              >
                <option value="">Todas las sucursales</option>
                {sucursales && sucursales.map((s) => (
                  <option key={s.id ?? s.value ?? s.name} value={s.id ?? s.value ?? s.name}>
                    {s.nombre ?? s.name ?? s.label ?? s.sucursal_nombre ?? s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Método de Pago</label>
              <select 
                className="form-select"
                value={filtros.metodoPago}
                onChange={(e) => handleFiltroChange('metodoPago', e.target.value)}
              >
                <option value="">Todos los métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta Debito">Tarjeta Débito</option>
                <option value="Tarjeta Credito">Tarjeta Crédito</option>
                <option value="Cheque">Cheque</option>
                <option value="Pago Online">Pago Online</option>
                <option value="Credito (Deuda)">Crédito (Deuda)</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <div className="d-flex w-100 gap-2">
                <button className="btn btn-primary flex-grow-1" onClick={handleBuscar}>
                  <i className="bi bi-search me-2"></i>
                  Buscar
                </button>
                <button className="btn btn-outline-secondary" onClick={handleClearFilters} title="Limpiar filtros">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-success text-white">
          <h5 className="card-title mb-0">Consolidado de Ventas Diarias</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Sucursal</th>
                  <th>Efectivo</th>
                  <th>Transferencia</th>
                  <th>T. Débito</th>
                  <th>T. Crédito</th>
                  <th>Cheque</th>
                  <th>Online</th>
                  <th>Crédito Deuda</th>
                  <th>Total Venta Día</th>
                  <th>Deuda Día</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasList.length === 0 && (
                  <tr>
                    <td colSpan="12" className="text-center">No hay ventas para los filtros seleccionados</td>
                  </tr>
                )}
                {ventasList.map((v) => (
                  <tr key={v.id}>
                    <td>{formatDate(v.fecha)}</td>
                    <td>{v.sucursal_nombre ?? v.sucursal}</td>
                    <td>{v.metodos_pago === 'Efectivo' ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td>{v.metodos_pago === 'Transferencia' ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td>{(v.metodos_pago === 'Tarejeta Debito' || v.metodos_pago === 'Tarjeta Debito') ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td>{v.metodos_pago === 'Tarjeta Credito' ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td>{v.metodos_pago === 'Cheque' ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td>{v.metodos_pago === 'Pago Online' ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td>{v.metodos_pago === 'Credito (Deuda)' ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td className="fw-bold">{v.total ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td className="text-danger">{v.metodos_pago === 'Credito (Deuda)' ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleVerDia(v.fecha)}
                      >
                        Ver Día
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="2">TOTAL</td>
                  <td>{`$${Number(totals.efectivo).toLocaleString()}`}</td>
                  <td>{`$${Number(totals.transferencia).toLocaleString()}`}</td>
                  <td>{`$${Number(totals.tDebito).toLocaleString()}`}</td>
                  <td>{`$${Number(totals.tCredito).toLocaleString()}`}</td>
                  <td>{`$${Number(totals.cheque).toLocaleString()}`}</td>
                  <td>{`$${Number(totals.online).toLocaleString()}`}</td>
                  <td>{`$${Number(totals.creditoDeuda).toLocaleString()}`}</td>
                  <td>{`$${Number(totals.totalVenta).toLocaleString()}`}</td>
                  <td className="text-danger">{`$${Number(totals.deuda).toLocaleString()}`}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {showNuevaVenta && (
        <NuevaVenta 
          onClose={() => setShowNuevaVenta(false)}
          onSave={handleGuardarVenta}
        />
      )}

      {showDetalle && ventaSeleccionada && (
        <DetalleVenta 
          venta={ventaSeleccionada} 
          onClose={() => setShowDetalle(false)} 
        />
      )}
    </div>
  );
}

export default Ventas;