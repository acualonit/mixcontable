import React, { useState } from 'react';
import LiquidacionSueldo from './LiquidacionSueldo';

function NuevaLiquidacion({ onClose, onSave }) {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [periodo, setPeriodo] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showLiquidacion, setShowLiquidacion] = useState(false);
  const [datosAdicionales, setDatosAdicionales] = useState({
    horasExtra: 0,
    bonos: 0,
    comisiones: 0,
    movilizacion: 0,
    colacion: 0,
    anticipos: 0
  });

  // Datos de ejemplo de la empresa
  const empresa = {
    razonSocial: 'Mi Empresa SpA',
    rut: '76.123.456-7',
    direccion: 'Av. Principal 123, Santiago'
  };

  // Datos de ejemplo de empleados (esto debería venir de la base de datos)
  const empleados = [
    {
      id: 1,
      nombreCompleto: 'Juan Pérez',
      numeroDocumento: '12.345.678-9',
      cargo: 'Vendedor',
      fechaIngresoLaboral: '2023-01-15',
      tipoContrato: 'indefinido',
      salarioBruto: 800000,
      afp: 'Habitat',
      afpRate: 11.27,
      entidadSalud: 'Fonasa'
    }
  ];

  const handleGenerarLiquidacion = () => {
    const empleado = empleados.find(e => e.id === parseInt(empleadoSeleccionado));
    if (!empleado) return;

    // Agregar los datos adicionales al empleado
    const empleadoConDatosAdicionales = {
      ...empleado,
      ...datosAdicionales
    };

    setShowLiquidacion(true);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nueva Liquidación de Sueldo</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Período</label>
              <input
                type="month"
                className="form-control"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Empleado</label>
              <select
                className="form-select"
                value={empleadoSeleccionado}
                onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                required
              >
                <option value="">Seleccionar empleado</option>
                {empleados.map(empleado => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombreCompleto} - {empleado.numeroDocumento}
                  </option>
                ))}
              </select>
            </div>

            {empleadoSeleccionado && (
              <>
                <h6 className="mb-3">Datos Adicionales del Mes</h6>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Horas Extra</label>
                    <input
                      type="number"
                      className="form-control"
                      value={datosAdicionales.horasExtra}
                      onChange={(e) => setDatosAdicionales({
                        ...datosAdicionales,
                        horasExtra: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Bonos</label>
                    <input
                      type="number"
                      className="form-control"
                      value={datosAdicionales.bonos}
                      onChange={(e) => setDatosAdicionales({
                        ...datosAdicionales,
                        bonos: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Comisiones</label>
                    <input
                      type="number"
                      className="form-control"
                      value={datosAdicionales.comisiones}
                      onChange={(e) => setDatosAdicionales({
                        ...datosAdicionales,
                        comisiones: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Movilización</label>
                    <input
                      type="number"
                      className="form-control"
                      value={datosAdicionales.movilizacion}
                      onChange={(e) => setDatosAdicionales({
                        ...datosAdicionales,
                        movilizacion: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Colación</label>
                    <input
                      type="number"
                      className="form-control"
                      value={datosAdicionales.colacion}
                      onChange={(e) => setDatosAdicionales({
                        ...datosAdicionales,
                        colacion: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Anticipos</label>
                    <input
                      type="number"
                      className="form-control"
                      value={datosAdicionales.anticipos}
                      onChange={(e) => setDatosAdicionales({
                        ...datosAdicionales,
                        anticipos: parseInt(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleGenerarLiquidacion}
              disabled={!empleadoSeleccionado}
            >
              Generar Liquidación
            </button>
          </div>
        </div>
      </div>

      {showLiquidacion && (
        <LiquidacionSueldo
          empleado={{
            ...empleados.find(e => e.id === parseInt(empleadoSeleccionado)),
            ...datosAdicionales
          }}
          empresa={empresa}
          periodo={new Date(periodo)}
          onClose={() => setShowLiquidacion(false)}
          onSave={(liquidacion) => {
            onSave({
              empleadoId: empleadoSeleccionado,
              periodo,
              liquidacion
            });
            setShowLiquidacion(false);
            onClose();
          }}
          onPrint={(liquidacion) => {
            // Aquí iría la lógica para imprimir la liquidación
            console.log('Imprimir liquidación:', liquidacion);
          }}
        />
      )}
    </div>
  );
}

export default NuevaLiquidacion;