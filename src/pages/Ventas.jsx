import React, { useState, useEffect } from 'react';
import NuevaVenta from '../components/ventas/NuevaVenta';
import DetalleVenta from '../components/ventas/DetalleVenta';
import VentasDiarias from '../components/ventas/VentasDiarias';
import VentasEliminadas from '../components/ventas/VentasEliminadas';
import VentaMasiva from '../components/ventas/VentaMasiva';
import ventasApi from '../utils/ventasApi';
import { fetchPublicSucursales } from '../utils/configApi';

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
    fetchPublicSucursales()
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setSucursales(list || []);
      })
      .catch(err => {
        console.error('Error cargando sucursales (public):', err);
        setSucursales([]);
      });
    return () => { mounted = false; };
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
    const params = {};
    if (filtros.fecha) params.fecha = filtros.fecha;
    if (filtros.sucursal) params.sucursal = filtros.sucursal;
    if (filtros.metodoPago) params.metodoPago = filtros.metodoPago;

    ventasApi.listVentas(params)
      .then(res => {
        setVentasList(res.data || []);
      })
      .catch(err => {
        console.error(err);
        alert('Error al obtener ventas');
      });
  };

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
                <option value="central">Sucursal Central</option>
                <option value="norte">Sucursal Norte</option>
                <option value="sur">Sucursal Sur</option>
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
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Tarjeta Débito</option>
                <option value="credito">Tarjeta Crédito</option>
                <option value="cheque">Cheque</option>
                <option value="online">Pago Online</option>
                <option value="credito_deuda">Crédito (Deuda)</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={handleBuscar}>
                <i className="bi bi-search me-2"></i>
                Buscar
              </button>
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
                    <td>{v.fecha}</td>
                    <td>{v.sucursal}</td>
                    <td>{v.subtotal ? `$${Number(v.subtotal).toLocaleString()}` : '-'}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td className="fw-bold">{v.total ? `$${Number(v.total).toLocaleString()}` : '-'}</td>
                    <td className="text-danger">-</td>
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
                  <td>$800,000</td>
                  <td>$500,000</td>
                  <td>$350,000</td>
                  <td>$650,000</td>
                  <td>$100,000</td>
                  <td>$150,000</td>
                  <td>$250,000</td>
                  <td>$2,800,000</td>
                  <td className="text-danger">$250,000</td>
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