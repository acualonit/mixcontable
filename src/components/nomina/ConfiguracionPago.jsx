import React, { useState } from 'react';

function ConfiguracionPago({ onBack }) {
  const [empleados] = useState([
    {
      id: 1,
      nombre: 'Juan Pérez',
      documento: '12.345.678-9',
      tipoDocumento: 'RUT',
      cargo: 'Vendedor',
      sucursal: 'Central',
      preferencia: 'Liquidación de Sueldo'
    }
  ]);

  const handlePreferenciaChange = (empleadoId, nuevaPreferencia) => {
    // Aquí irá la lógica para actualizar la preferencia en la base de datos
    console.log('Actualizando preferencia:', { empleadoId, nuevaPreferencia });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Configuración de Pago</h2>
        </div>
      </div>

      <div className="alert alert-info">
        <h5 className="alert-heading">Información Importante</h5>
        <p className="mb-0">
          En esta sección deberán configurar cuál de los cálculos será el que sea válido para hacer el pago al personal. 
          Se puede elegir si será válido el cálculo entregado en las liquidaciones de sueldo o el que realizan mediante 
          comprobante de pago. Tener en cuenta que la elección que se elija será la que se muestre en la principal y 
          descontará en el flujo de caja.
        </p>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Preferencias de Pago de Nómina</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Cargo</th>
                  <th>Sucursal</th>
                  <th>Preferencia</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((empleado) => (
                  <tr key={empleado.id}>
                    <td>{empleado.nombre}</td>
                    <td>
                      <span className="d-block">{empleado.documento}</span>
                      <small className="text-muted">{empleado.tipoDocumento}</small>
                    </td>
                    <td>{empleado.cargo}</td>
                    <td>{empleado.sucursal}</td>
                    <td>
                      <select
                        className="form-select"
                        value={empleado.preferencia}
                        onChange={(e) => handlePreferenciaChange(empleado.id, e.target.value)}
                      >
                        <option value="Liquidación de Sueldo">Liquidación de Sueldo</option>
                        <option value="Comprobante de Pago">Comprobante de Pago</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracionPago;