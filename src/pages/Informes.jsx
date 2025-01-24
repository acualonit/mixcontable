import React, { useState } from 'react';
import { exportToExcel } from '../utils/exportUtils';

function Informes() {
  const [tipoInforme, setTipoInforme] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [filtros, setFiltros] = useState({
    sucursal: '',
    categoria: '',
    estado: ''
  });
  const [formatoExportacion, setFormatoExportacion] = useState('excel');
  const [informeGenerado, setInformeGenerado] = useState(null);

  // Datos de ejemplo para informes recientes
  const [informesRecientes] = useState([
    {
      id: 1,
      nombre: 'Balance General - Noviembre 2023',
      tipo: 'balance',
      fecha: '2023-12-01',
      usuario: 'Admin',
      formato: 'excel'
    },
    {
      id: 2,
      nombre: 'Estado de Resultados - Noviembre 2023',
      tipo: 'resultados',
      fecha: '2023-12-01',
      usuario: 'Admin',
      formato: 'pdf'
    }
  ]);

  // Datos de ejemplo para informes programados
  const [informesProgramados] = useState([
    {
      id: 1,
      nombre: 'Balance General - Diciembre 2023',
      tipo: 'balance',
      fechaProgramada: '2023-12-31',
      frecuencia: 'mensual',
      formato: 'excel'
    },
    {
      id: 2,
      nombre: 'Informe de Ventas - Diciembre 2023',
      tipo: 'ventas',
      fechaProgramada: '2023-12-31',
      frecuencia: 'mensual',
      formato: 'pdf'
    }
  ]);

  const handleGenerarInforme = () => {
    // Aquí iría la lógica para generar el informe según el tipo y período seleccionados
    const informe = {
      tipo: tipoInforme,
      periodo,
      datos: {
        // Datos de ejemplo
        ingresos: 15000000,
        egresos: 10000000,
        utilidad: 5000000
      }
    };
    setInformeGenerado(informe);
  };

  const handleExportar = () => {
    if (!informeGenerado) return;

    if (formatoExportacion === 'excel') {
      // Ejemplo de exportación a Excel
      const dataToExport = [
        {
          'Concepto': 'Ingresos',
          'Monto': informeGenerado.datos.ingresos
        },
        {
          'Concepto': 'Egresos',
          'Monto': informeGenerado.datos.egresos
        },
        {
          'Concepto': 'Utilidad',
          'Monto': informeGenerado.datos.utilidad
        }
      ];

      exportToExcel(dataToExport, `Informe_${tipoInforme}_${periodo}`);
    } else {
      // Aquí iría la lógica para exportar a PDF
      console.log('Exportando a PDF...');
    }
  };

  const handleProgramarInforme = () => {
    // Aquí iría la lógica para programar un informe
    console.log('Programando informe:', { tipoInforme, periodo, filtros });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Informes</h2>
        <button 
          className="btn btn-primary"
          onClick={handleProgramarInforme}
        >
          <i className="bi bi-clock me-2"></i>
          Programar Informe
        </button>
      </div>

      {/* Generador de Informes */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Generador de Informes</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Tipo de Informe</label>
              <select 
                className="form-select"
                value={tipoInforme}
                onChange={(e) => setTipoInforme(e.target.value)}
              >
                <option value="">Seleccionar tipo</option>
                <option value="balance">Balance General</option>
                <option value="resultados">Estado de Resultados</option>
                <option value="flujo">Flujo de Caja</option>
                <option value="ventas">Informe de Ventas</option>
                <option value="compras">Informe de Compras</option>
                <option value="gastos">Informe de Gastos</option>
                <option value="impuestos">Informe de Impuestos</option>
                <option value="inventario">Informe de Inventario</option>
                <option value="clientes">Informe de Clientes</option>
                <option value="proveedores">Informe de Proveedores</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Período</label>
              <select 
                className="form-select"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <option value="">Seleccionar período</option>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Formato de Exportación</label>
              <select 
                className="form-select"
                value={formatoExportacion}
                onChange={(e) => setFormatoExportacion(e.target.value)}
              >
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Sucursal</label>
              <select
                className="form-select"
                value={filtros.sucursal}
                onChange={(e) => setFiltros({...filtros, sucursal: e.target.value})}
              >
                <option value="">Todas las sucursales</option>
                <option value="central">Sucursal Central</option>
                <option value="norte">Sucursal Norte</option>
                <option value="sur">Sucursal Sur</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={filtros.categoria}
                onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                <option value="productos">Productos</option>
                <option value="servicios">Servicios</option>
                <option value="operativos">Operativos</option>
                <option value="administrativos">Administrativos</option>
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
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="pendiente">Pendiente</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button 
              className="btn btn-primary"
              onClick={handleGenerarInforme}
              disabled={!tipoInforme || !periodo}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              Generar Informe
            </button>
            <button 
              className="btn btn-success"
              onClick={handleExportar}
              disabled={!informeGenerado}
            >
              <i className={`bi bi-file-earmark-${formatoExportacion} me-2`}></i>
              Exportar {formatoExportacion.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Vista Previa del Informe */}
      {informeGenerado && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="card-title mb-0">Vista Previa del Informe</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ingresos</td>
                    <td>${informeGenerado.datos.ingresos.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Egresos</td>
                    <td>${informeGenerado.datos.egresos.toLocaleString()}</td>
                  </tr>
                  <tr className="table-info">
                    <td><strong>Utilidad</strong></td>
                    <td><strong>${informeGenerado.datos.utilidad.toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* Informes Recientes */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">Informes Recientes</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                {informesRecientes.map(informe => (
                  <div key={informe.id} className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">{informe.nombre}</h6>
                      <small>{informe.fecha}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Generado por: {informe.usuario}</small>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-primary">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-success">
                          <i className={`bi bi-file-earmark-${informe.formato}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Informes Programados */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-warning">
              <h5 className="card-title mb-0">Informes Programados</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                {informesProgramados.map(informe => (
                  <div key={informe.id} className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">{informe.nombre}</h6>
                      <small>Programado: {informe.fechaProgramada}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Frecuencia: {informe.frecuencia}</small>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-warning">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-danger">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Informes;