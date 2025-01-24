import React, { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  calculateSalaryLiquidation,
  numberToSpanishWords,
  formatCurrency,
  UTM_VALUE,
  UF_VALUE,
  MAX_CONTRIBUTION_BASE_UF,
  MAX_UNEMPLOYMENT_BASE_UF
} from '../../utils/payrollUtils';

function LiquidacionSueldo({ 
  empleado,
  empresa,
  periodo,
  onClose,
  onSave,
  onPrint
}) {
  const liquidacionRef = useRef(null);

  const liquidacion = calculateSalaryLiquidation({
    baseSalary: empleado.salarioBruto,
    afpRate: empleado.afpRate,
    isapre: empleado.entidadSalud === 'Isapre' ? {
      ufAmount: empleado.valorCotizacion,
      name: empleado.nombreIsapre
    } : null,
    contractType: empleado.tipoContrato,
    overtimeHours: empleado.horasExtra || 0,
    bonuses: empleado.bonos || 0,
    allowances: {
      mobilization: empleado.movilizacion || 0,
      lunch: empleado.colacion || 0
    },
    advances: empleado.anticipos || 0
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = liquidacionRef.current.innerHTML;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Liquidación de Sueldo</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            @media print {
              body {
                padding: 20px;
                font-size: 12px;
              }
              .modal-footer,
              .btn-close {
                display: none !important;
              }
              .card {
                border: 1px solid #ddd !important;
                margin-bottom: 15px !important;
              }
              .card-header {
                background-color: #f8f9fa !important;
                border-bottom: 1px solid #ddd !important;
              }
              .table {
                margin-bottom: 0 !important;
              }
              @page {
                size: letter;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleSave = () => {
    onSave({
      empleado: {
        id: empleado.id,
        nombreCompleto: empleado.nombreCompleto,
        numeroDocumento: empleado.numeroDocumento
      },
      periodo: format(periodo, 'yyyy-MM'),
      totals: liquidacion.totals,
      deductions: liquidacion.deductions
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">LIQUIDACIÓN DE SUELDO</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" ref={liquidacionRef}>
            {/* Encabezado de la Empresa */}
            <div className="text-center mb-4">
              <h4>{empresa.razonSocial}</h4>
              <p className="mb-1">RUT: {empresa.rut}</p>
              <p className="mb-1">{empresa.direccion}</p>
            </div>

            {/* Información del Empleado */}
            <div className="row mb-4">
              <div className="col-md-8">
                <p><strong>Nombre:</strong> {empleado.nombreCompleto}</p>
                <p><strong>RUT:</strong> {empleado.numeroDocumento}</p>
                <p><strong>Fecha de Pago:</strong> {format(periodo, 'dd/MM/yyyy')}</p>
              </div>
              <div className="col-md-4">
                <p><strong>Fecha Ingreso:</strong> {format(new Date(empleado.fechaIngresoLaboral), 'dd/MM/yyyy')}</p>
                <p><strong>Cargo:</strong> {empleado.cargo}</p>
                <p><strong>Tipo de Contrato:</strong> {empleado.tipoContrato}</p>
              </div>
            </div>

            {/* Información de Bases */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Bases de Cálculo</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <p><strong>Base Imponible:</strong></p>
                    <p>{formatCurrency(liquidacion.bases.contribution)}</p>
                  </div>
                  <div className="col-md-3">
                    <p><strong>Base Seg. Cesantía:</strong></p>
                    <p>{formatCurrency(liquidacion.bases.unemployment)}</p>
                  </div>
                  <div className="col-md-3">
                    <p><strong>Base Tributable:</strong></p>
                    <p>{formatCurrency(liquidacion.bases.taxable)}</p>
                  </div>
                  <div className="col-md-3">
                    <p><strong>UTM:</strong> {formatCurrency(UTM_VALUE)}</p>
                    <p><strong>UF:</strong> {formatCurrency(UF_VALUE)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Haberes */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Haberes</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="mb-3">Haberes Imponibles</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td>Sueldo Base</td>
                          <td className="text-end">{formatCurrency(liquidacion.earnings.imponible.base)}</td>
                        </tr>
                        <tr>
                          <td>Gratificación</td>
                          <td className="text-end">{formatCurrency(liquidacion.earnings.imponible.gratification)}</td>
                        </tr>
                        <tr>
                          <td>Horas Extras</td>
                          <td className="text-end">{formatCurrency(liquidacion.earnings.imponible.overtime)}</td>
                        </tr>
                        <tr>
                          <td>Bonos</td>
                          <td className="text-end">{formatCurrency(liquidacion.earnings.imponible.bonuses)}</td>
                        </tr>
                        <tr className="table-light">
                          <th>Total Haberes Imponibles</th>
                          <th className="text-end">{formatCurrency(liquidacion.earnings.imponible.total)}</th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3">Haberes No Imponibles</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td>Movilización</td>
                          <td className="text-end">{formatCurrency(liquidacion.earnings.nonImponible.mobilization)}</td>
                        </tr>
                        <tr>
                          <td>Colación</td>
                          <td className="text-end">{formatCurrency(liquidacion.earnings.nonImponible.lunch)}</td>
                        </tr>
                        <tr className="table-light">
                          <th>Total Haberes No Imponibles</th>
                          <th className="text-end">{formatCurrency(liquidacion.earnings.nonImponible.total)}</th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Descuentos */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Descuentos</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="mb-3">Descuentos Legales</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td>AFP ({empleado.afpRate}%)</td>
                          <td className="text-end">{formatCurrency(liquidacion.deductions.legal.afp)}</td>
                        </tr>
                        <tr>
                          <td>Salud ({empleado.entidadSalud})</td>
                          <td className="text-end">{formatCurrency(liquidacion.deductions.legal.health)}</td>
                        </tr>
                        <tr>
                          <td>Seguro Cesantía</td>
                          <td className="text-end">{formatCurrency(liquidacion.deductions.legal.unemployment)}</td>
                        </tr>
                        <tr>
                          <td>Impuesto Único</td>
                          <td className="text-end">{formatCurrency(liquidacion.deductions.legal.tax)}</td>
                        </tr>
                        <tr className="table-light">
                          <th>Total Descuentos Legales</th>
                          <th className="text-end">{formatCurrency(liquidacion.deductions.legal.total)}</th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3">Otros Descuentos</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td>Anticipos</td>
                          <td className="text-end">{formatCurrency(liquidacion.deductions.other.advances)}</td>
                        </tr>
                        <tr className="table-light">
                          <th>Total Otros Descuentos</th>
                          <th className="text-end">{formatCurrency(liquidacion.deductions.other.total)}</th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Resumen</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th>Total Haberes</th>
                          <td className="text-end">{formatCurrency(liquidacion.totals.gross)}</td>
                        </tr>
                        <tr>
                          <th>Total Descuentos</th>
                          <td className="text-end text-danger">-{formatCurrency(liquidacion.deductions.total)}</td>
                        </tr>
                        <tr className="table-primary">
                          <th>Alcance Líquido</th>
                          <th className="text-end">{formatCurrency(liquidacion.totals.net)}</th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Son:</strong></p>
                    <p className="border p-2 bg-light">
                      {numberToSpanishWords(liquidacion.totals.net)} pesos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firma */}
            <div className="row mt-5">
              <div className="col-md-6 text-center">
                <div style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '10px' }}>
                  Firma del Trabajador
                </div>
              </div>
              <div className="col-md-6 text-center">
                <div style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '10px' }}>
                  Firma del Empleador
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button 
              type="button" 
              className="btn btn-success" 
              onClick={handleSave}
            >
              <i className="bi bi-check-circle me-2"></i>
              Guardar
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handlePrint}
            >
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiquidacionSueldo;