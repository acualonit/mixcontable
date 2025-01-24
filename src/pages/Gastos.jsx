import React, { useState } from 'react';
import NuevoGasto from '../components/gastos/NuevoGasto';
import DetalleGasto from '../components/gastos/DetalleGasto';
import GastosEliminados from '../components/gastos/GastosEliminados';

function Gastos() {
  const [showNuevoGasto, setShowNuevoGasto] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showGastosEliminados, setShowGastosEliminados] = useState(false);
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha: '',
    categoria: '',
    sucursal: '',
    estado: ''
  });

  // Datos de ejemplo para los resúmenes
  const resumenGastos = {
    gastosHoy: {
      cantidad: 3,
      total: 450000
    },
    gastosMes: {
      cantidad: 15,
      total: 2800000
    },
    gastosMesAnterior: {
      cantidad: 12,
      total: 2100000
    },
    gastosAnio: {
      cantidad: 180,
      total: 32000000
    }
  };

  const handleVerDetalle = (gasto) => {
    setGastoSeleccionado(gasto);
    setShowDetalle(true);
  };

  const handleGuardarGasto = (gastoData) => {
    console.log('Nuevo gasto:', gastoData);
    setShowNuevoGasto(false);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (showGastosEliminados) {
    return <GastosEliminados onBack={() => setShowGastosEliminados(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gastos</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-danger"
            onClick={() => setShowNuevoGasto(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Gasto
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => setShowGastosEliminados(true)}
          >
            <i className="bi bi-trash me-2"></i>
            Gastos Eliminados
          </button>
        </div>
      </div>

      {/* Resúmenes de Gastos */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Gastos de Hoy</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenGastos.gastosHoy.total.toLocaleString()}</h3>
                  <small>{resumenGastos.gastosHoy.cantidad} gastos</small>
                </div>
                <i className="bi bi-receipt fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Gastos del Mes</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenGastos.gastosMes.total.toLocaleString()}</h3>
                  <small>{resumenGastos.gastosMes.cantidad} gastos</small>
                </div>
                <i className="bi bi-calendar-check fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6 className="card-title">Gastos Mes Anterior</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenGastos.gastosMesAnterior.total.toLocaleString()}</h3>
                  <small>{resumenGastos.gastosMesAnterior.cantidad} gastos</small>
                </div>
                <i className="bi bi-calendar-minus fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-secondary text-white">
            <div className="card-body">
              <h6 className="card-title">Gastos del Año</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">${resumenGastos.gastosAnio.total.toLocaleString()}</h3>
                  <small>{resumenGastos.gastosAnio.cantidad} gastos</small>
                </div>
                <i className="bi bi-calendar3 fs-1 opacity-50"></i>
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
              <label className="form-label">Categoría</label>
              <select 
                className="form-select"
                value={filtros.categoria}
                onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              >
                <option value="">Todas las categorías</option>
                <option value="operativos">Gastos Operativos</option>
                <option value="administrativos">Gastos Administrativos</option>
                <option value="marketing">Marketing y Publicidad</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="servicios">Servicios Básicos</option>
                <option value="otros">Otros Gastos</option>
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
                <option value="pagado">Pagado</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">Registro de Gastos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>N° Interno</th>
                  <th>Sucursal</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Tipo Documento</th>
                  <th>N° Documento</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2023-12-01</td>
                  <td>GAST-001</td>
                  <td>Central</td>
                  <td>Operativos</td>
                  <td>Mantenimiento equipos</td>
                  <td>Factura</td>
                  <td>1234</td>
                  <td>$300,000</td>
                  <td><span className="badge bg-success">Pagado</span></td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleVerDetalle({
                          numeroInterno: 'GAST-001',
                          fecha: '2023-12-01',
                          sucursal: 'Central',
                          categoria: 'Operativos',
                          descripcion: 'Mantenimiento equipos',
                          tipoDocumento: 'Factura',
                          numeroDocumento: '1234',
                          monto: 300000,
                          estado: 'pagado',
                          historial: [
                            {
                              fecha: '2023-12-01 09:30',
                              usuario: 'Juan Pérez',
                              accion: 'Creación del gasto'
                            },
                            {
                              fecha: '2023-12-01 14:15',
                              usuario: 'María González',
                              accion: 'Actualización de estado a Pagado'
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

      {showNuevoGasto && (
        <NuevoGasto 
          onClose={() => setShowNuevoGasto(false)}
          onSave={handleGuardarGasto}
        />
      )}

      {showDetalle && gastoSeleccionado && (
        <DetalleGasto 
          gasto={gastoSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setGastoSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default Gastos;