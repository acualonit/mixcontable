import React, { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { numberToSpanishWords } from '../../utils/payrollUtils';

function ComprobantePago({ 
  empleado,
  empresa,
  periodo,
  totales,
  onClose,
  onSave
}) {
  const comprobanteRef = useRef(null);

  const generatePDFContent = () => {
    const content = comprobanteRef.current.innerHTML;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante de Pago</title>
          <style>
            @media print {
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                font-size: 12px;
                line-height: 1.5;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .subtitle {
                font-size: 10px;
                font-style: italic;
                margin-bottom: 15px;
              }
              .company {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 15px;
              }
              .employee-info {
                margin-bottom: 20px;
              }
              .section {
                margin-bottom: 15px;
              }
              .section-title {
                font-weight: bold;
                text-decoration: underline;
                margin-bottom: 10px;
              }
              .row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              .totals {
                margin-top: 15px;
                border-top: 1px solid black;
                padding-top: 10px;
              }
              .signature {
                margin-top: 50px;
                text-align: center;
              }
              .signature-line {
                width: 200px;
                border-top: 1px solid black;
                margin: 50px auto 10px;
              }
              @page {
                size: letter;
                margin: 2cm;
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
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePDFContent());
    printWindow.document.close();
  };

  const handleGuardar = () => {
    onSave({
      empleado,
      empresa,
      periodo: format(new Date(periodo), 'yyyy-MM'),
      totales,
      fechaGeneracion: new Date().toISOString(),
      pdfData: generatePDFContent()
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Vista Previa del Comprobante</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div ref={comprobanteRef}>
              <div className="text-center mb-4">
                <h4 className="mb-1">COMPROBANTE DE PAGO</h4>
                <p className="small text-muted fst-italic">
                  Este comprobante no representa una liquidación de sueldo ni tiene carácter legal
                </p>
                <h5>{empresa.razonSocial}</h5>
                <p className="mb-0">RUT: {empresa.rut}</p>
                <p className="mb-0">{empresa.direccion}</p>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <p><strong>Nombre:</strong> {empleado.nombreCompleto}</p>
                  <p><strong>RUT:</strong> {empleado.numeroDocumento}</p>
                  <p><strong>Fecha de Pago:</strong> {format(new Date(), 'dd/MM/yyyy')}</p>
                  <p><strong>Período de Pago:</strong> {format(new Date(periodo), 'MMMM yyyy', { locale: es })}</p>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2">HABERES</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Sueldo base:</span>
                    <span>${totales.totalHaberes.toLocaleString()}</span>
                  </div>
                  {totales.bonos > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Bonos:</span>
                      <span>${totales.bonos.toLocaleString()}</span>
                    </div>
                  )}
                  {totales.comisiones > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Comisiones:</span>
                      <span>${totales.comisiones.toLocaleString()}</span>
                    </div>
                  )}
                  {totales.horasExtras > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Horas Extras:</span>
                      <span>${totales.horasExtras.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2">DESCUENTOS</h6>
                  {totales.anticipos > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Anticipos:</span>
                      <span>-${totales.anticipos.toLocaleString()}</span>
                    </div>
                  )}
                  {totales.otrosDescuentos > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Otros Descuentos:</span>
                      <span>-${totales.otrosDescuentos.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2">RESUMEN</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Total Haberes:</strong>
                    <strong>${totales.totalHaberes.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Total Descuentos:</strong>
                    <strong>-${totales.totalDescuentos.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Alcance Líquido:</strong>
                    <strong>${totales.sueldoLiquido.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <strong>Son:</strong> {numberToSpanishWords(totales.sueldoLiquido)} pesos
              </div>

              <div className="row mt-5">
                <div className="col-6 text-center">
                  <div style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '10px' }}>
                    Firma del Trabajador
                  </div>
                </div>
                <div className="col-6 text-center">
                  <div style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '10px' }}>
                    Firma del Empleador
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-success" onClick={handleGuardar}>
              <i className="bi bi-check-circle me-2"></i>
              Guardar Comprobante
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComprobantePago;