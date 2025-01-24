import React, { useState } from 'react';
import { exportToExcel } from '../../utils/exportUtils';
import NuevaLiquidacion from './NuevaLiquidacion';

function LibroRemuneraciones({ onBack }) {
  const [periodo, setPeriodo] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showNuevaLiquidacion, setShowNuevaLiquidacion] = useState(false);

  // Estado para el libro de remuneraciones
  const [libroRemuneraciones, setLibroRemuneraciones] = useState([
    {
      id: 1,
      mes: 'Diciembre',
      año: '2023',
      nombre: 'Juan Pérez',
      documento: 'LIQ-001',
      haberes: 1500000,
      descuentos: 300000,
      sueldoLiquido: 1200000
    }
  ]);

  const handleExportarExcel = () => {
    const dataToExport = libroRemuneraciones.map(registro => ({
      'Mes': registro.mes,
      'Año': registro.año,
      'Nombre': registro.nombre,
      'N° Documento': registro.documento,
      'Haberes': registro.haberes,
      'Descuentos': registro.descuentos,
      'Sueldo Líquido': registro.sueldoLiquido
    }));

    exportToExcel(dataToExport, `Libro_Remuneraciones_${periodo}`);
  };

  const handleGuardarLiquidacion = (data) => {
    const [año, mes] = data.periodo.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const nuevaLiquidacion = {
      id: libroRemuneraciones.length + 1,
      mes: meses[parseInt(mes) - 1],
      año: año,
      nombre: data.liquidacion.empleado.nombreCompleto,
      documento: `LIQ-${String(libroRemuneraciones.length + 1).padStart(3, '0')}`,
      haberes: data.liquidacion.totals.gross,
      descuentos: data.liquidacion.deductions.total,
      sueldoLiquido: data.liquidacion.totals.net
    };

    setLibroRemuneraciones([...libroRemuneraciones, nuevaLiquidacion]);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Libro de Remuneraciones</h2>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-success"
            onClick={() => setShowNuevaLiquidacion(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Liquidación
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleExportarExcel}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Período</label>
              <input
                type="month"
                className="form-control"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla del Libro de Remuneraciones */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Libro de Remuneraciones</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Mes</th>
                  <th>Año</th>
                  <th>Nombre</th>
                  <th>N° Documento</th>
                  <th>Haberes</th>
                  <th>Descuentos</th>
                  <th>Sueldo Líquido</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {libroRemuneraciones.map((registro) => (
                  <tr key={registro.id}>
                    <td>{registro.mes}</td>
                    <td>{registro.año}</td>
                    <td>{registro.nombre}</td>
                    <td>{registro.documento}</td>
                    <td>${registro.haberes.toLocaleString()}</td>
                    <td>${registro.descuentos.toLocaleString()}</td>
                    <td>${registro.sueldoLiquido.toLocaleString()}</td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-info"
                          title="Imprimir liquidación"
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="4">TOTALES</td>
                  <td>${libroRemuneraciones.reduce((sum, reg) => sum + reg.haberes, 0).toLocaleString()}</td>
                  <td>${libroRemuneraciones.reduce((sum, reg) => sum + reg.descuentos, 0).toLocaleString()}</td>
                  <td>${libroRemuneraciones.reduce((sum, reg) => sum + reg.sueldoLiquido, 0).toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Liquidación */}
      {showNuevaLiquidacion && (
        <NuevaLiquidacion
          onClose={() => setShowNuevaLiquidacion(false)}
          onSave={(data) => {
            handleGuardarLiquidacion(data);
            setShowNuevaLiquidacion(false);
          }}
        />
      )}
    </div>
  );
}

export default LibroRemuneraciones;