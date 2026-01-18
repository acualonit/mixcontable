import React, { useState, useEffect, useMemo } from 'react';
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
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
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

  const handleVerDia = (fecha, sucursal) => {
    setFechaSeleccionada(fecha);
    setSucursalSeleccionada(sucursal ?? null);
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
        console.error('Error creando venta:', err);
        // Mostrar errores de validación si API los devuelve en err.body.errors
        const body = err && err.body ? err.body : null;
        if (body && body.errors) {
          const messages = Object.entries(body.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
          alert('Errores de validación:\n' + messages);
        } else if (body && body.message) {
          alert(body.message);
        } else {
          alert(err.message || 'Error al guardar la venta');
        }
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

  const normalizeMetodoPago = (mpRaw) => {
    const mp = (mpRaw || '').toString().trim();
    switch (mp) {
      case 'Efectivo':
        return 'efectivo';
      case 'Transferencia':
        return 'transferencia';
      case 'Tarjeta Debito':
      case 'Tarejeta Debito':
      case 'Tarjeta Débito':
        return 'tDebito';
      case 'Tarjeta Credito':
      case 'Tarjeta Crédito':
        return 'tCredito';
      case 'Cheque':
        return 'cheque';
      case 'Pago Online':
        return 'online';
      case 'Credito (Deuda)':
      case 'Crédito (Deuda)':
        return 'creditoDeuda';
      default:
        return 'otros';
    }
  };

  const groupedVentas = useMemo(() => {
    // clave: YYYY-MM-DD|sucursal
    const map = new Map();

    for (const v of ventasList) {
      const fechaKey = String(v.fecha || '').slice(0, 10);
      const sucKey = String(v.sucursal_nombre ?? v.sucursal ?? '').trim();
      const key = `${fechaKey}|${sucKey}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          fecha: fechaKey,
          sucursal: sucKey,
          sucursal_id: v.sucursal_id ?? null,
          efectivo: 0,
          transferencia: 0,
          tDebito: 0,
          tCredito: 0,
          cheque: 0,
          online: 0,
          creditoDeuda: 0,
          otros: 0,
          totalVentaDia: 0,
          deudaDia: 0,
        });
      }

      const row = map.get(key);
      const amt = Number(v.total) || 0;
      const bucket = normalizeMetodoPago(v.metodos_pago);

      row[bucket] += amt;
      row.totalVentaDia += amt;
      if (bucket === 'creditoDeuda') row.deudaDia += amt;
    }

    return Array.from(map.values())
      .sort((a, b) => {
        // fecha desc, sucursal asc
        if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
        return a.sucursal.localeCompare(b.sucursal);
      });
  }, [ventasList]);

  const totals = useMemo(() => {
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

    groupedVentas.forEach(r => {
      t.efectivo += r.efectivo;
      t.transferencia += r.transferencia;
      t.tDebito += r.tDebito;
      t.tCredito += r.tCredito;
      t.cheque += r.cheque;
      t.online += r.online;
      t.creditoDeuda += r.creditoDeuda;
      t.otros += r.otros;
      t.totalVenta += r.totalVentaDia;
      t.deuda += r.deudaDia;
    });

    return t;
  }, [groupedVentas]);

  if (showVentasDiarias) {
    return (
      <VentasDiarias 
        fecha={fechaSeleccionada}
        sucursal={sucursalSeleccionada}
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
                {groupedVentas.length === 0 && (
                  <tr>
                    <td colSpan="12" className="text-center">No hay ventas para los filtros seleccionados</td>
                  </tr>
                )}
                {groupedVentas.map((r) => (
                  <tr key={r.key}>
                    <td>{formatDate(r.fecha)}</td>
                    <td>{r.sucursal}</td>
                    <td>{r.efectivo ? `$${Number(r.efectivo).toLocaleString()}` : '-'}</td>
                    <td>{r.transferencia ? `$${Number(r.transferencia).toLocaleString()}` : '-'}</td>
                    <td>{r.tDebito ? `$${Number(r.tDebito).toLocaleString()}` : '-'}</td>
                    <td>{r.tCredito ? `$${Number(r.tCredito).toLocaleString()}` : '-'}</td>
                    <td>{r.cheque ? `$${Number(r.cheque).toLocaleString()}` : '-'}</td>
                    <td>{r.online ? `$${Number(r.online).toLocaleString()}` : '-'}</td>
                    <td>{r.creditoDeuda ? `$${Number(r.creditoDeuda).toLocaleString()}` : '-'}</td>
                    <td className="fw-bold">{r.totalVentaDia ? `$${Number(r.totalVentaDia).toLocaleString()}` : '-'}</td>
                    <td className="text-danger">{r.deudaDia ? `$${Number(r.deudaDia).toLocaleString()}` : '-'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleVerDia(r.fecha, r.sucursal_id ?? r.sucursal)}
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