import React, { useState } from 'react';
import DetalleHistorialEgreso from './DetalleHistorialEgreso';
import HistorialFinancieroEgreso from './HistorialFinancieroEgreso';
import { exportToExcel } from '../../utils/exportUtils';

function HistorialEgresosRecurrentes({ onBack }) {
  const [mes, setMes] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [filtros, setFiltros] = useState({
    estadoPago: '',
    categoria: '',
    anioCompra: ''
  });

  const [showDetalle, setShowDetalle] = useState(false);
  const [showFinanzas, setShowFinanzas] = useState(false);
  const [egresoSeleccionado, setEgresoSeleccionado] = useState(null);

  // Datos de ejemplo
  const egresos = [
    {
      id: 1,
      fechaCompra: '2023-01-15',
      categoria: 'compra_activos',
      detalleCuenta: 'Compra Maquinaria Industrial',
      cuotasRestantes: 24,
      valorRestante: 12000000,
      estadoPago: 'pendiente',
      proveedor: 'Proveedor A',
      rut: '76.123.456-7',
      nombreCuenta: 'Maquinaria Industrial XYZ',
      fechaInicioPago: '2023-02-01',
      unidadCobro: 'pesos',
      valorActivo: 15000000,
      valorCuotaMensual: 500000,
      cantidadCuotas: 36,
      diasPago: 15,
      nombreActivo: 'Máquina XYZ',
      clasificacion: 'Maquinaria de Fabricación',
      modeloActivo: 'XYZ-2023',
      marcaActivo: 'Industrial Co.',
      referenciaActivo: 'REF-001',
      proveedorFinanciador: 'Banco ABC',
      tipoDocumento: 'Factura',
      totalPagado: 3000000,
      restanteDeuda: 12000000,
      cuotasPagadas: 12,
      cuotasProyectadas: [
        {
          fechaPago: '2023-02-15',
          numeroCuota: 1,
          valorCuota: 500000,
          fechaPagada: '2023-02-15',
          valorPagado: 500000,
          tipoDocumento: 'Transferencia',
          numeroDocumento: 'TR-001',
          amortizacion: 375000,
          estado: 'pagada'
        },
        {
          fechaPago: '2023-03-15',
          numeroCuota: 2,
          valorCuota: 500000,
          fechaPagada: '2023-03-15',
          valorPagado: 500000,
          tipoDocumento: 'Transferencia',
          numeroDocumento: 'TR-002',
          amortizacion: 380000,
          estado: 'pagada'
        },
        {
          fechaPago: '2023-12-15',
          numeroCuota: 11,
          valorCuota: 500000,
          fechaPagada: null,
          valorPagado: null,
          tipoDocumento: null,
          numeroDocumento: null,
          amortizacion: null,
          estado: 'pendiente'
        }
      ]
    }
  ];

  const handleVerDetalle = (egreso) => {
    setEgresoSeleccionado(egreso);
    setShowDetalle(true);
  };

  const handleVerFinanzas = (egreso) => {
    setEgresoSeleccionado(egreso);
    setShowFinanzas(true);
  };

  const handleExportarExcel = () => {
    const dataToExport = egresos.map(egreso => ({
      'Fecha Compra': egreso.fechaCompra,
      'Categoría': egreso.categoria,
      'Detalle de la Cuenta': egreso.detalleCuenta,
      'Cuotas Restantes': egreso.cuotasRestantes,
      'Valor Restante': egreso.valorRestante,
      'Estado de Cuenta': egreso.estadoPago
    }));

    exportToExcel(dataToExport, 'Historial_Egresos_Recurrentes');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Historial de Cuentas Recurrentes</h2>
        </div>
        <button 
          className="btn btn-success"
          onClick={handleExportarExcel}
        >
          <i className="bi bi-file-earmark-excel me-2"></i>
          Exportar Excel
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Estado de Pago</label>
              <select
                className="form-select"
                value={filtros.estadoPago}
                onChange={(e) => setFiltros({...filtros, estadoPago: e.target.value})}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente de Pago</option>
                <option value="pagada">Pagada</option>
                <option value="descartado">Descartado de Pago</option>
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
                <option value="compra_activos">Compra de Activos</option>
                <option value="arriendo">Arriendo de Local</option>
                <option value="deuda_bancos">Deuda con Bancos</option>
                <option value="leasing">Leasing</option>
                <option value="otros">Otros Pagos</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Año de Compra</label>
              <select
                className="form-select"
                value={filtros.anioCompra}
                onChange={(e) => setFiltros({...filtros, anioCompra: e.target.value})}
              >
                <option value="">Todos los años</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Historial de Cuentas Recurrentes</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha Compra</th>
                  <th>Categoría</th>
                  <th>Detalle de la Cuenta</th>
                  <th>Cuotas Restantes</th>
                  <th>Valor Restante</th>
                  <th>Estado de Cuenta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {egresos.map((egreso) => (
                  <tr key={egreso.id}>
                    <td>{egreso.fechaCompra}</td>
                    <td>{egreso.categoria}</td>
                    <td>{egreso.detalleCuenta}</td>
                    <td>{egreso.cuotasRestantes}</td>
                    <td>${typeof egreso.valorRestante === 'number' ? egreso.valorRestante.toLocaleString() : egreso.valorRestante}</td>
                    <td>
                      <span className={`badge bg-${
                        egreso.estadoPago === 'pendiente' ? 'warning' :
                        egreso.estadoPago === 'pagada' ? 'success' :
                        'danger'
                      }`}>
                        {egreso.estadoPago.charAt(0).toUpperCase() + egreso.estadoPago.slice(1)}
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
                          onClick={() => handleVerFinanzas(egreso)}
                          title="Ver tabla de amortización"
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

      {showDetalle && egresoSeleccionado && (
        <DetalleHistorialEgreso
          egreso={egresoSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setEgresoSeleccionado(null);
          }}
        />
      )}

      {showFinanzas && egresoSeleccionado && (
        <HistorialFinancieroEgreso
          egreso={egresoSeleccionado}
          onClose={() => {
            setShowFinanzas(false);
            setEgresoSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default HistorialEgresosRecurrentes;