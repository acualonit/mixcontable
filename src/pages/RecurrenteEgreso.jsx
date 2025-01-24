import React, { useState } from 'react';
import NuevoEgresoRecurrente from '../components/recurrente/NuevoEgresoRecurrente';
import DetalleEgresoRecurrente from '../components/recurrente/DetalleEgresoRecurrente';
import EditarEgresoRecurrente from '../components/recurrente/EditarEgresoRecurrente';
import PagoRecurrente from '../components/recurrente/PagoRecurrente';
import HistorialEgresosRecurrentes from '../components/recurrente/HistorialEgresosRecurrentes';
import { exportToExcel } from '../utils/exportUtils';

function RecurrenteEgreso() {
  const [showNuevoEgreso, setShowNuevoEgreso] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [egresoSeleccionado, setEgresoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    estado: ''
  });

  // Datos de ejemplo para los egresos recurrentes
  const [egresos] = useState([
    {
      id: 1,
      categoria: 'deuda_bancos',
      detalleCuenta: 'Préstamo Banco Estado',
      cuotaMes: 1500000,
      diasPago: 15,
      estado: 'pendiente',
      estadoPago: 'pendiente' // Estado de pago de la cuenta general
    },
    {
      id: 2,
      categoria: 'leasing',
      detalleCuenta: 'Leasing Vehículo',
      cuotaMes: 800000,
      diasPago: 10,
      estado: 'vencida',
      estadoPago: 'pagada' // Este no se mostrará en la tabla
    },
    {
      id: 3,
      categoria: 'arriendo',
      detalleCuenta: 'Arriendo Local Central',
      cuotaMes: 2500000,
      diasPago: 5,
      estado: 'pagada',
      estadoPago: 'descartado' // Este no se mostrará en la tabla
    }
  ]);

  // Filtrar primero por estado de pago pendiente
  const egresosPendientes = egresos.filter(egreso => 
    egreso.estadoPago === 'pendiente'
  );

  // Luego aplicar los filtros adicionales solo a los egresos pendientes
  const egresosFiltrados = egresosPendientes.filter(egreso => {
    const cumpleFiltroCategoria = !filtros.categoria || egreso.categoria === filtros.categoria;
    const cumpleFiltroEstado = !filtros.estado || egreso.estado === filtros.estado;
    return cumpleFiltroCategoria && cumpleFiltroEstado;
  });

  // Calcular resúmenes basados en los egresos pendientes
  const resumen = {
    totalEgresos: egresosFiltrados.reduce((sum, egreso) => sum + egreso.cuotaMes, 0),
    cantidadEgresos: egresosFiltrados.length,
    egresosActivos: egresosFiltrados.filter(e => e.estado === 'pendiente' || e.estado === 'vencida').length,
    egresosPagados: egresosFiltrados.filter(e => e.estado === 'pagada').length
  };

  const handleVerDetalle = (egreso) => {
    setEgresoSeleccionado(egreso);
    setShowDetalle(true);
  };

  const handlePagar = (egreso) => {
    setEgresoSeleccionado(egreso);
    setShowPago(true);
  };

  const handleExportarExcel = () => {
    const dataToExport = egresosFiltrados.map(egreso => ({
      Categoría: egreso.categoria,
      'Detalle de la Cuenta': egreso.detalleCuenta,
      'Cuota Mes': egreso.cuotaMes,
      'Días de Pago': egreso.diasPago,
      Estado: egreso.estado.charAt(0).toUpperCase() + egreso.estado.slice(1)
    }));

    exportToExcel(dataToExport, 'Egresos_Recurrentes');
  };

  // Función para determinar el color del badge según el estado
  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'vencida':
        return 'danger';
      case 'pagada':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Función para obtener el nombre de la categoría
  const getCategoriaLabel = (categoria) => {
    const categorias = {
      deuda_bancos: 'Deuda con Bancos',
      leasing: 'Leasing',
      arriendo: 'Arriendo de Locales',
      activos: 'Compra de Activos',
      otros: 'Otros Pagos'
    };
    return categorias[categoria] || categoria;
  };

  if (showHistorial) {
    return <HistorialEgresosRecurrentes onBack={() => setShowHistorial(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Egresos Recurrentes</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoEgreso(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Egreso Recurrente
          </button>
          <button 
            className="btn btn-info"
            onClick={() => setShowHistorial(true)}
          >
            <i className="bi bi-clock-history me-2"></i>
            Historial
          </button>
          <button 
            className="btn btn-success"
            onClick={handleExportarExcel}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Resumen de Egresos */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Total Egresos Recurrentes</h6>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">${resumen.totalEgresos.toLocaleString()}</h3>
                <i className="bi bi-cash-stack fs-1 opacity-50"></i>
              </div>
              <small>{resumen.cantidadEgresos} egresos en total</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Egresos Activos</h6>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">{resumen.egresosActivos}</h3>
                <i className="bi bi-clock-history fs-1 opacity-50"></i>
              </div>
              <small>Pendientes y vencidos</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Egresos Pagados</h6>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">{resumen.egresosPagados}</h3>
                <i className="bi bi-check-circle fs-1 opacity-50"></i>
              </div>
              <small>Este mes</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={filtros.categoria}
                onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                <option value="deuda_bancos">Deuda con Bancos</option>
                <option value="leasing">Leasing</option>
                <option value="arriendo">Arriendo de Locales</option>
                <option value="activos">Compra de Activos</option>
                <option value="otros">Otros Pagos</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
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

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Egresos Recurrentes Pendientes de Pago</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Categoría</th>
                  <th>Detalle de la Cuenta</th>
                  <th>Cuota Mes</th>
                  <th>Días de Pago</th>
                  <th>Estado Cuota</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {egresosFiltrados.map((egreso) => (
                  <tr key={egreso.id}>
                    <td>{getCategoriaLabel(egreso.categoria)}</td>
                    <td>{egreso.detalleCuenta}</td>
                    <td>${egreso.cuotaMes.toLocaleString()}</td>
                    <td>{egreso.diasPago}</td>
                    <td>
                      <span className={`badge bg-${getBadgeColor(egreso.estado)}`}>
                        {egreso.estado.charAt(0).toUpperCase() + egreso.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(egreso)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handlePagar(egreso)}
                          title="Realizar pago"
                          disabled={egreso.estado === 'pagada'}
                        >
                          <i className="bi bi-cash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {egresosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No se encontraron egresos pendientes de pago
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevoEgreso && (
        <NuevoEgresoRecurrente
          onClose={() => setShowNuevoEgreso(false)}
          onSave={(egreso) => {
            console.log('Nuevo egreso:', egreso);
            setShowNuevoEgreso(false);
          }}
        />
      )}

      {showDetalle && egresoSeleccionado && (
        <DetalleEgresoRecurrente
          egreso={egresoSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setEgresoSeleccionado(null);
          }}
        />
      )}

      {showEditar && egresoSeleccionado && (
        <EditarEgresoRecurrente
          egreso={egresoSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setEgresoSeleccionado(null);
          }}
          onSave={(egresoEditado) => {
            console.log('Egreso editado:', egresoEditado);
            setShowEditar(false);
            setEgresoSeleccionado(null);
          }}
        />
      )}

      {showPago && egresoSeleccionado && (
        <PagoRecurrente
          egreso={egresoSeleccionado}
          onClose={() => {
            setShowPago(false);
            setEgresoSeleccionado(null);
          }}
          onSave={(pago) => {
            console.log('Pago registrado:', pago);
            setShowPago(false);
            setEgresoSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default RecurrenteEgreso;