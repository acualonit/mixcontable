import React, { useState } from 'react';
import NuevoServicio from '../components/servicios/NuevoServicio';
import NuevaCategoria from '../components/servicios/NuevaCategoria';
import DetalleServicio from '../components/servicios/DetalleServicio';
import EditarPagoServicio from '../components/servicios/EditarPagoServicio';
import RealizarPago from '../components/servicios/RealizarPago';
import ServiciosProgramados from '../components/servicios/ServiciosProgramados';
import { exportToExcel } from '../utils/exportUtils';

function ServiciosMes() {
  const [showNuevoServicio, setShowNuevoServicio] = useState(false);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [showDetalleServicio, setShowDetalleServicio] = useState(false);
  const [showEditarServicio, setShowEditarServicio] = useState(false);
  const [showRealizarPago, setShowRealizarPago] = useState(false);
  const [showServiciosProgramados, setShowServiciosProgramados] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filtros, setFiltros] = useState({
    servicio: '',
    estado: '',
    sucursal: ''
  });

  // Datos de ejemplo para los servicios
  const [servicios] = useState([
    {
      id: 1,
      servicio: 'Agua Potable',
      proveedor: 'Aguas Andinas',
      sucursal: 'Central',
      fechaVencimiento: '2023-12-15',
      montoEstimado: 150000,
      montoReal: null,
      estado: 'pendiente'
    }
  ]);

  // Datos de ejemplo para los resúmenes
  const resumen = {
    serviciosMes: servicios.length,
    valorPorPagar: servicios.reduce((total, servicio) => 
      servicio.estado === 'pendiente' ? total + servicio.montoEstimado : total, 0),
    valorPagado: servicios.reduce((total, servicio) => 
      servicio.estado === 'pagado' ? total + (servicio.montoReal || servicio.montoEstimado) : total, 0)
  };

  const handleVerDetalle = (servicio) => {
    setServicioSeleccionado(servicio);
    setShowDetalleServicio(true);
  };

  const handleEditar = (servicio) => {
    setServicioSeleccionado(servicio);
    setShowEditarServicio(true);
  };

  const handleRealizarPago = (servicio) => {
    setServicioSeleccionado(servicio);
    setShowRealizarPago(true);
  };

  if (showServiciosProgramados) {
    return <ServiciosProgramados onBack={() => setShowServiciosProgramados(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Servicios del Mes</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-info"
            onClick={() => setShowServiciosProgramados(true)}
          >
            <i className="bi bi-calendar-check me-2"></i>
            Servicios Programados
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevaCategoria(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Agregar Categoría
          </button>
          <button 
            className="btn btn-success"
            onClick={() => setShowNuevoServicio(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Servicio
          </button>
          <button 
            className="btn btn-light"
            onClick={() => {
              const dataToExport = servicios.map(servicio => ({
                Servicio: servicio.servicio,
                Proveedor: servicio.proveedor,
                Sucursal: servicio.sucursal,
                'Fecha Vencimiento': servicio.fechaVencimiento,
                'Monto Estimado': servicio.montoEstimado,
                'Monto Real': servicio.montoReal || '-',
                Estado: servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)
              }));
              exportToExcel(dataToExport, 'Servicios_Mensuales');
            }}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Servicios del Mes</h6>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">{resumen.serviciosMes}</h3>
                <i className="bi bi-list-check fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Valor Por Pagar</h6>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">${resumen.valorPorPagar.toLocaleString()}</h3>
                <i className="bi bi-cash-stack fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Valor Pagado</h6>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">${resumen.valorPagado.toLocaleString()}</h3>
                <i className="bi bi-check-circle fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Mes</label>
          <input
            type="month"
            className="form-control"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Servicio</label>
          <select 
            className="form-select"
            value={filtros.servicio}
            onChange={(e) => setFiltros({...filtros, servicio: e.target.value})}
          >
            <option value="">Todos los servicios</option>
            <option value="agua">Agua Potable</option>
            <option value="energia">Energía Eléctrica</option>
            <option value="gas">Gas Natural</option>
            <option value="internet">Internet</option>
            <option value="gastos_comunes">Gastos Comunes</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Estado</label>
          <select 
            className="form-select"
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>

      {/* Tabla de Servicios Mensuales */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Servicios Mensuales</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Servicio</th>
                  <th>Proveedor</th>
                  <th>Sucursal</th>
                  <th>Fecha Vencimiento</th>
                  <th>Monto Estimado</th>
                  <th>Monto Real</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td>{servicio.servicio}</td>
                    <td>{servicio.proveedor}</td>
                    <td>{servicio.sucursal}</td>
                    <td>{servicio.fechaVencimiento}</td>
                    <td>${servicio.montoEstimado.toLocaleString()}</td>
                    <td>
                      {servicio.montoReal 
                        ? `$${servicio.montoReal.toLocaleString()}`
                        : '-'
                      }
                    </td>
                    <td>
                      <span className={`badge bg-${servicio.estado === 'pagado' ? 'success' : 'warning'}`}>
                        {servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(servicio)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(servicio)}
                          title="Editar pago del mes"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleRealizarPago(servicio)}
                          title="Realizar pago"
                          disabled={servicio.estado === 'pagado'}
                        >
                          <i className="bi bi-cash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevoServicio && (
        <NuevoServicio
          onClose={() => setShowNuevoServicio(false)}
          onSave={(servicio) => {
            console.log('Nuevo servicio:', servicio);
            setShowNuevoServicio(false);
          }}
        />
      )}

      {showNuevaCategoria && (
        <NuevaCategoria
          onClose={() => setShowNuevaCategoria(false)}
          onSave={(categoria) => {
            console.log('Nueva categoría:', categoria);
            setShowNuevaCategoria(false);
          }}
        />
      )}

      {showDetalleServicio && servicioSeleccionado && (
        <DetalleServicio 
          servicio={servicioSeleccionado}
          onClose={() => {
            setShowDetalleServicio(false);
            setServicioSeleccionado(null);
          }}
        />
      )}

      {showEditarServicio && servicioSeleccionado && (
        <EditarPagoServicio
          servicio={servicioSeleccionado}
          onClose={() => {
            setShowEditarServicio(false);
            setServicioSeleccionado(null);
          }}
          onSave={(data) => {
            console.log('Servicio actualizado:', data);
            setShowEditarServicio(false);
            setServicioSeleccionado(null);
          }}
        />
      )}

      {showRealizarPago && servicioSeleccionado && (
        <RealizarPago
          servicio={servicioSeleccionado}
          onClose={() => {
            setShowRealizarPago(false);
            setServicioSeleccionado(null);
          }}
          onSave={(pago) => {
            console.log('Pago realizado:', pago);
            setShowRealizarPago(false);
            setServicioSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default ServiciosMes;