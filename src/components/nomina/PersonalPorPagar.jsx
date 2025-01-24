import React, { useState } from 'react';
import PagoNomina from './PagoNomina';
import LiquidacionSueldo from './LiquidacionSueldo';
import ComprobantePago from './ComprobantePago';

function PersonalPorPagar({ onBack }) {
  const [showPago, setShowPago] = useState(false);
  const [showDocumento, setShowDocumento] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  // Datos de ejemplo
  const [empleados] = useState([
    {
      id: 1,
      periodo: '2024-01',
      estadoPago: 'Por Pagar',
      nombre: 'Juan Pérez',
      documento: '12.345.678-9',
      tipoDocumento: 'RUT',
      cargo: 'Vendedor',
      sucursal: 'Central',
      totalPagar: 800000,
      valorPagado: 0,
      metodoPago: '',
      preferencia: 'Liquidación de Sueldo'
    }
  ]);

  const handlePagar = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setShowPago(true);
  };

  const handleVerDocumento = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setShowDocumento(true);
  };

  // Calcular totales
  const totales = empleados.reduce((acc, empleado) => {
    acc.totalNomina += empleado.totalPagar;
    acc.totalPagado += empleado.valorPagado;
    acc.restantePagar = acc.totalNomina - acc.totalPagado;
    return acc;
  }, { totalNomina: 0, totalPagado: 0, restantePagar: 0 });

  // Filtrar empleados
  const empleadosFiltrados = empleados.filter(empleado => 
    !filtroEstado || empleado.estadoPago === filtroEstado
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Personal Disponible Para Pago De Nómina</h2>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">Todos los estados</option>
            <option value="Por Pagar">Por Pagar</option>
            <option value="Pagado">Pagado</option>
          </select>
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Total Nómina</h6>
              <h3>${totales.totalNomina.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Total Pagado</h6>
              <h3>${totales.totalPagado.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Restante por Pagar</h6>
              <h3>${totales.restantePagar.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Personal por Pagar</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Periodo de Pago</th>
                  <th>Estado de Pago</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Cargo</th>
                  <th>Sucursal</th>
                  <th>Total a Pagar</th>
                  <th>Valor Pagado</th>
                  <th>Método de Pago</th>
                  <th>Preferencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id}>
                    <td>{empleado.periodo}</td>
                    <td>
                      <span className={`badge bg-${empleado.estadoPago === 'Pagado' ? 'success' : 'warning'}`}>
                        {empleado.estadoPago}
                      </span>
                    </td>
                    <td>{empleado.nombre}</td>
                    <td>
                      <span className="d-block">{empleado.documento}</span>
                      <small className="text-muted">{empleado.tipoDocumento}</small>
                    </td>
                    <td>{empleado.cargo}</td>
                    <td>{empleado.sucursal}</td>
                    <td>${empleado.totalPagar.toLocaleString()}</td>
                    <td>${empleado.valorPagado.toLocaleString()}</td>
                    <td>{empleado.metodoPago || '-'}</td>
                    <td>{empleado.preferencia}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handlePagar(empleado)}
                          disabled={empleado.estadoPago === 'Pagado'}
                        >
                          <i className="bi bi-cash"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDocumento(empleado)}
                        >
                          <i className="bi bi-file-text"></i>
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

      {/* Modal de Pago */}
      {showPago && empleadoSeleccionado && (
        <PagoNomina
          empleado={empleadoSeleccionado}
          onClose={() => {
            setShowPago(false);
            setEmpleadoSeleccionado(null);
          }}
          onSave={(data) => {
            console.log('Pago registrado:', data);
            setShowPago(false);
            setEmpleadoSeleccionado(null);
          }}
        />
      )}

      {/* Modal de Documento */}
      {showDocumento && empleadoSeleccionado && (
        <>
          {empleadoSeleccionado.preferencia === 'Liquidación de Sueldo' ? (
            <LiquidacionSueldo
              empleado={empleadoSeleccionado}
              onClose={() => {
                setShowDocumento(false);
                setEmpleadoSeleccionado(null);
              }}
            />
          ) : (
            <ComprobantePago
              empleado={empleadoSeleccionado}
              onClose={() => {
                setShowDocumento(false);
                setEmpleadoSeleccionado(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default PersonalPorPagar;