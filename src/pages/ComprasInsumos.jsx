import React, { useState } from 'react';
import NuevaCompra from '../components/compras/NuevaCompra';
import DetalleCompra from '../components/compras/DetalleCompra';
import ComprasEliminadas from '../components/compras/ComprasEliminadas';

function ComprasInsumos() {
  const [showNuevaCompra, setShowNuevaCompra] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showComprasEliminadas, setShowComprasEliminadas] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha: '',
    proveedor: '',
    sucursal: '',
    estado: ''
  });

  // Datos de ejemplo para los resúmenes
  const resumenCompras = {
    comprasHoy: {
      cantidad: 5,
      total: 2500000,
      iva: 475000
    },
    comprasMes: {
      cantidad: 25,
      total: 12500000,
      iva: 2375000
    },
    comprasMesAnterior: {
      cantidad: 22,
      total: 11000000,
      iva: 2090000
    },
    comprasAnio: {
      cantidad: 280,
      total: 140000000,
      iva: 26600000
    }
  };

  const handleVerDetalle = (compra) => {
    setCompraSeleccionada(compra);
    setShowDetalle(true);
  };

  const handleGuardarCompra = (compraData) => {
    console.log('Nueva compra:', compraData);
    setShowNuevaCompra(false);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (showComprasEliminadas) {
    return <ComprasEliminadas onBack={() => setShowComprasEliminadas(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Compras de Insumos</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevaCompra(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Compra
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => setShowComprasEliminadas(true)}
          >
            <i className="bi bi-trash me-2"></i>
            Compras Eliminadas
          </button>
        </div>
      </div>

      {/* Resúmenes de Compras */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Compras de Hoy</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenCompras.comprasHoy.total.toLocaleString()}</h3>
                  <small>{resumenCompras.comprasHoy.cantidad} compras</small>
                </div>
                <i className="bi bi-cart4 fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Compras del Mes</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenCompras.comprasMes.total.toLocaleString()}</h3>
                  <small>{resumenCompras.comprasMes.cantidad} compras</small>
                </div>
                <i className="bi bi-calendar-check fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6 className="card-title">Compras Mes Anterior</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenCompras.comprasMesAnterior.total.toLocaleString()}</h3>
                  <small>{resumenCompras.comprasMesAnterior.cantidad} compras</small>
                </div>
                <i className="bi bi-calendar-minus fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Compras del Año</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenCompras.comprasAnio.total.toLocaleString()}</h3>
                  <small>{resumenCompras.comprasAnio.cantidad} compras</small>
                </div>
                <i className="bi bi-calendar3 fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IVA Acumulado del Mes */}
      <div className="card mb-4">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">IVA Acumulado del Mes</h5>
        </div>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h2 className="mb-0">${resumenCompras.comprasMes.iva.toLocaleString()}</h2>
              <small className="text-muted">Total IVA acumulado en el mes actual</small>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-end">
                <button className="btn btn-outline-danger">
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Generar Informe IVA
                </button>
              </div>
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
              <select 
                className="form-select"
                value={filtros.proveedor}
                onChange={(e) => handleFiltroChange('proveedor', e.target.value)}
              >
                <option value="">Todos los proveedores</option>
                <option value="proveedor1">Proveedor 1</option>
                <option value="proveedor2">Proveedor 2</option>
              </select>
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
              <label className="form-label">Estado</label>
              <select 
                className="form-select"
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="anulada">Anulada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Registro de Compras</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>N° Interno</th>
                  <th>Sucursal</th>
                  <th>Proveedor</th>
                  <th>RUT</th>
                  <th>Tipo Documento</th>
                  <th>N° Documento</th>
                  <th>Monto Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01</td>
                  <td>COMP-001</td>
                  <td>Central</td>
                  <td>Proveedor A</td>
                  <td>76.123.456-7</td>
                  <td>Factura Afecta</td>
                  <td>1234</td>
                  <td>$800,000</td>
                  <td><span className="badge bg-success">Pagada</span></td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleVerDetalle({
                          numeroInterno: 'COMP-001',
                          fecha: '2023-12-01',
                          sucursal: 'Central',
                          proveedor: 'Proveedor A',
                          rut: '76.123.456-7',
                          tipoDocumento: 'Factura Afecta',
                          numeroDocumento: '1234',
                          estado: 'pagada',
                          subtotal: 672269,
                          iva: 127731,
                          total: 800000,
                          items: [
                            {
                              descripcion: 'Producto A',
                              cantidad: 2,
                              precioUnitario: 250000
                            },
                            {
                              descripcion: 'Producto B',
                              cantidad: 1,
                              precioUnitario: 172269
                            }
                          ],
                          historial: [
                            {
                              fecha: '2023-12-01 10:30',
                              usuario: 'Juan Pérez',
                              accion: 'Creación de la compra'
                            },
                            {
                              fecha: '2023-12-01 15:45',
                              usuario: 'María González',
                              accion: 'Actualización de estado a Pagada'
                            }
                          ]
                        })}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-warning">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-danger">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNuevaCompra && (
        <NuevaCompra 
          onClose={() => setShowNuevaCompra(false)}
          onSave={handleGuardarCompra}
        />
      )}

      {showDetalle && compraSeleccionada && (
        <DetalleCompra 
          compra={compraSeleccionada}
          onClose={() => {
            setShowDetalle(false);
            setCompraSeleccionada(null);
          }}
        />
      )}
    </div>
  );
}

export default ComprasInsumos;