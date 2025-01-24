import React, { useState, useRef } from 'react';

function VentaMasiva({ onBack }) {
  const [ventas, setVentas] = useState([]);
  const fileInputRef = useRef(null);

  const handleDescargarExcel = () => {
    // Aquí se implementará la lógica para descargar la plantilla Excel
    console.log('Descargando plantilla Excel...');
  };

  const handleSubirArchivo = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Aquí se implementará la lógica para procesar el archivo Excel
      // Por ahora solo mostraremos datos de ejemplo
      setVentas([
        {
          dia: '01',
          mes: '12',
          año: '2023',
          documentoVenta: 'Factura Afecta a IVA',
          folioVenta: '1234',
          detalle: 'Venta de productos',
          rutCliente: '12.345.678-9',
          nombreCliente: 'Cliente Ejemplo',
          efectivo: 100000,
          transferencia: 0,
          tarjetaCredito: 200000,
          numeroVoucherCredito: 'VC001',
          tarjetaDebito: 0,
          numeroVoucherDebito: '',
          cheque: 0,
          numeroCheque: '',
          pagoOnline: 0,
          ventaCredito: 0
        }
      ]);
    }
  };

  const handleGuardarVentas = () => {
    // Aquí se implementará la lógica para guardar las ventas masivas
    console.log('Guardando ventas masivas:', ventas);
    onBack();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Agregar Venta Masiva</h2>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={handleDescargarExcel}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Descargar Archivo Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept=".xlsx,.xls"
            onChange={handleSubirArchivo}
          />
          <button 
            className="btn btn-primary"
            onClick={() => fileInputRef.current.click()}
          >
            <i className="bi bi-upload me-2"></i>
            Subir Archivo con Ventas
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Vista Previa de Ventas</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Día</th>
                  <th>Mes</th>
                  <th>Año</th>
                  <th>Documento de Venta</th>
                  <th>Folio de Venta</th>
                  <th>Detalle</th>
                  <th>RUT Cliente</th>
                  <th>Nombre Cliente</th>
                  <th>Efectivo</th>
                  <th>Transferencia</th>
                  <th>T. Crédito</th>
                  <th>N° Voucher</th>
                  <th>T. Débito</th>
                  <th>N° Voucher</th>
                  <th>Cheque</th>
                  <th>N° Cheque</th>
                  <th>Pago Online</th>
                  <th>Venta a Crédito</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta, index) => (
                  <tr key={index}>
                    <td>{venta.dia}</td>
                    <td>{venta.mes}</td>
                    <td>{venta.año}</td>
                    <td>{venta.documentoVenta}</td>
                    <td>{venta.folioVenta}</td>
                    <td>{venta.detalle}</td>
                    <td>{venta.rutCliente}</td>
                    <td>{venta.nombreCliente}</td>
                    <td>${venta.efectivo.toLocaleString()}</td>
                    <td>${venta.transferencia.toLocaleString()}</td>
                    <td>${venta.tarjetaCredito.toLocaleString()}</td>
                    <td>{venta.numeroVoucherCredito}</td>
                    <td>${venta.tarjetaDebito.toLocaleString()}</td>
                    <td>{venta.numeroVoucherDebito}</td>
                    <td>${venta.cheque.toLocaleString()}</td>
                    <td>{venta.numeroCheque}</td>
                    <td>${venta.pagoOnline.toLocaleString()}</td>
                    <td>${venta.ventaCredito.toLocaleString()}</td>
                  </tr>
                ))}
                {ventas.length === 0 && (
                  <tr>
                    <td colSpan="18" className="text-center">
                      No hay ventas cargadas. Por favor, suba un archivo Excel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {ventas.length > 0 && (
        <div className="d-flex justify-content-end mt-4">
          <button 
            className="btn btn-success"
            onClick={handleGuardarVentas}
          >
            <i className="bi bi-check-circle me-2"></i>
            Guardar Ventas
          </button>
        </div>
      )}
    </div>
  );
}

export default VentaMasiva;