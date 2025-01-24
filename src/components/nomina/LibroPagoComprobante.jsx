import React, { useState } from 'react';
import { exportToExcel } from '../../utils/exportUtils';
import CalculoPagoComprobante from './CalculoPagoComprobante';
import ComprobantePago from './ComprobantePago';

function LibroPagoComprobante({ onBack }) {
  const [periodo, setPeriodo] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showCalculoPago, setShowCalculoPago] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showRecalcular, setShowRecalcular] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);

  // Estado para el libro de pagos
  const [libroPagos, setLibroPagos] = useState([]);

  const handleExportarExcel = () => {
    const dataToExport = libroPagos.map(registro => ({
      'Mes': registro.mes,
      'Año': registro.año,
      'Nombre': registro.nombre,
      'Documento': registro.documento,
      'Haberes': registro.haberes,
      'Descuentos': registro.descuentos,
      'Sueldo Líquido': registro.sueldoLiquido
    }));

    exportToExcel(dataToExport, `Libro_Pagos_Comprobante_${periodo}`);
  };

  const handleGuardarComprobante = (data) => {
    const [año, mes] = data.periodo.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const nuevoComprobante = {
      id: libroPagos.length + 1,
      mes: meses[parseInt(mes) - 1],
      año: año,
      nombre: data.empleado.nombreCompleto,
      documento: data.empleado.numeroDocumento,
      haberes: data.totales.totalHaberes,
      descuentos: data.totales.totalDescuentos,
      sueldoLiquido: data.totales.sueldoLiquido,
      detalleCompleto: {
        empresa: data.empresa,
        empleado: data.empleado,
        totales: data.totales,
        pdfData: data.pdfData // Guardamos los datos del PDF
      }
    };

    setLibroPagos([...libroPagos, nuevoComprobante]);
  };

  const handleVerDetalle = (comprobante) => {
    setComprobanteSeleccionado(comprobante);
    setShowDetalle(true);
  };

  const handleRecalcular = (comprobante) => {
    setComprobanteSeleccionado(comprobante);
    setShowRecalcular(true);
  };

  // Filtrar comprobantes por período
  const comprobantesFiltrados = libroPagos.filter(comprobante => {
    const [añoFiltro, mesFiltro] = periodo.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return comprobante.año === añoFiltro && 
           comprobante.mes === meses[parseInt(mesFiltro) - 1];
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Libro Pago Comprobante</h2>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-success"
            onClick={() => setShowCalculoPago(true)}
          >
            <i className="bi bi-calculator me-2"></i>
            Cálculo Pago Comprobantes
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

      {/* Tabla del Libro de Pagos */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Libro de Pagos por Comprobante</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Mes</th>
                  <th>Año</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Haberes</th>
                  <th>Descuentos</th>
                  <th>Sueldo Líquido</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {comprobantesFiltrados.map((registro) => (
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
                          onClick={() => handleVerDetalle(registro)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-info"
                          title="Imprimir comprobante"
                          onClick={() => {
                            // Generar y mostrar el PDF usando los datos guardados
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(registro.detalleCompleto.pdfData);
                            printWindow.document.close();
                            printWindow.onload = () => {
                              printWindow.print();
                              printWindow.close();
                            };
                          }}
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          title="Recalcular comprobante"
                          onClick={() => handleRecalcular(registro)}
                        >
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="4">TOTALES</td>
                  <td>${comprobantesFiltrados.reduce((sum, reg) => sum + reg.haberes, 0).toLocaleString()}</td>
                  <td>${comprobantesFiltrados.reduce((sum, reg) => sum + reg.descuentos, 0).toLocaleString()}</td>
                  <td>${comprobantesFiltrados.reduce((sum, reg) => sum + reg.sueldoLiquido, 0).toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Cálculo de Pago */}
      {showCalculoPago && (
        <CalculoPagoComprobante
          onClose={() => setShowCalculoPago(false)}
          onSave={(data) => {
            handleGuardarComprobante(data);
            setShowCalculoPago(false);
          }}
        />
      )}

      {/* Modal de Detalle/Impresión de Comprobante */}
      {showDetalle && comprobanteSeleccionado && (
        <ComprobantePago
          empleado={comprobanteSeleccionado.detalleCompleto.empleado}
          empresa={comprobanteSeleccionado.detalleCompleto.empresa}
          totales={comprobanteSeleccionado.detalleCompleto.totales}
          periodo={new Date(`${comprobanteSeleccionado.año}-${comprobanteSeleccionado.mes}-01`)}
          onClose={() => {
            setShowDetalle(false);
            setComprobanteSeleccionado(null);
          }}
          onSave={() => {
            setShowDetalle(false);
            setComprobanteSeleccionado(null);
          }}
        />
      )}

      {/* Modal de Recálculo */}
      {showRecalcular && comprobanteSeleccionado && (
        <CalculoPagoComprobante
          empleado={comprobanteSeleccionado.detalleCompleto.empleado}
          valoresAnteriores={comprobanteSeleccionado.detalleCompleto.totales}
          onClose={() => {
            setShowRecalcular(false);
            setComprobanteSeleccionado(null);
          }}
          onSave={(data) => {
            // Actualizar el comprobante existente
            const nuevosComprobantes = libroPagos.map(comp => {
              if (comp.id === comprobanteSeleccionado.id) {
                return {
                  ...comp,
                  haberes: data.totales.totalHaberes,
                  descuentos: data.totales.totalDescuentos,
                  sueldoLiquido: data.totales.sueldoLiquido,
                  detalleCompleto: {
                    empresa: data.empresa,
                    empleado: data.empleado,
                    totales: data.totales,
                    pdfData: data.pdfData // Guardamos los nuevos datos del PDF
                  }
                };
              }
              return comp;
            });
            setLibroPagos(nuevosComprobantes);
            setShowRecalcular(false);
            setComprobanteSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default LibroPagoComprobante;