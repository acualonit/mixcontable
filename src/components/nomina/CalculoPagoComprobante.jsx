import React, { useState } from 'react';
import ComprobantePago from './ComprobantePago';

function CalculoPagoComprobante({ onClose, onSave, empleado, valoresAnteriores }) {
  const [formData, setFormData] = useState({
    periodo: new Date().toISOString().split('T')[0].slice(0, 7),
    empleadoId: empleado?.id || '',
    bonos: valoresAnteriores?.bonos || 0,
    comisiones: valoresAnteriores?.comisiones || 0,
    horasExtras: valoresAnteriores?.horasExtras || 0,
    anticipo: valoresAnteriores?.anticipos || 0,
    otrosDescuentos: valoresAnteriores?.otrosDescuentos || 0
  });

  const [showComprobante, setShowComprobante] = useState(false);
  const [datosComprobante, setDatosComprobante] = useState(null);

  // Datos de ejemplo de empleados
  const empleados = [
    {
      id: 1,
      nombreCompleto: empleado?.nombreCompleto || 'Juan Pérez',
      numeroDocumento: empleado?.numeroDocumento || '12.345.678-9',
      salarioLiquidoReal: 800000
    }
  ];

  // Datos de ejemplo de la empresa
  const empresa = {
    razonSocial: 'Mi Empresa SpA',
    rut: '76.123.456-7',
    direccion: 'Av. Principal 123, Santiago'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const empleadoSeleccionado = empleados.find(e => e.id === parseInt(formData.empleadoId));
    if (!empleadoSeleccionado) return;

    // Calcular totales
    const totalHaberes = empleadoSeleccionado.salarioLiquidoReal + 
                        parseFloat(formData.bonos || 0) + 
                        parseFloat(formData.comisiones || 0) + 
                        parseFloat(formData.horasExtras || 0);
    
    const totalDescuentos = parseFloat(formData.anticipo || 0) + 
                           parseFloat(formData.otrosDescuentos || 0);

    const sueldoLiquido = totalHaberes - totalDescuentos;

    const datos = {
      periodo: formData.periodo,
      empleado: empleadoSeleccionado,
      empresa,
      totales: {
        totalHaberes,
        totalDescuentos,
        sueldoLiquido,
        bonos: parseFloat(formData.bonos || 0),
        comisiones: parseFloat(formData.comisiones || 0),
        horasExtras: parseFloat(formData.horasExtras || 0),
        anticipos: parseFloat(formData.anticipo || 0),
        otrosDescuentos: parseFloat(formData.otrosDescuentos || 0)
      }
    };

    setDatosComprobante(datos);
    setShowComprobante(true);
  };

  const handleModalClick = (e) => {
    e.stopPropagation(); // Evitar que el clic se propague al fondo
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog" onClick={handleModalClick}>
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Cálculo Pago Comprobante</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Período de Pago</label>
                <input
                  type="month"
                  className="form-control"
                  value={formData.periodo}
                  onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Empleado</label>
                <select
                  className="form-select"
                  value={formData.empleadoId}
                  onChange={(e) => setFormData({...formData, empleadoId: e.target.value})}
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

              {formData.empleadoId && (
                <>
                  <div className="alert alert-info">
                    <strong>Salario Líquido Real:</strong> $
                    {empleados.find(e => e.id === parseInt(formData.empleadoId))?.salarioLiquidoReal.toLocaleString()}
                  </div>

                  <h6 className="mb-3">Haberes Adicionales</h6>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Bonos</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.bonos}
                        onChange={(e) => setFormData({...formData, bonos: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Comisiones</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.comisiones}
                        onChange={(e) => setFormData({...formData, comisiones: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Horas Extras</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.horasExtras}
                        onChange={(e) => setFormData({...formData, horasExtras: e.target.value})}
                      />
                    </div>
                  </div>

                  <h6 className="mb-3">Descuentos</h6>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Anticipo</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.anticipo}
                        onChange={(e) => setFormData({...formData, anticipo: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Otros Descuentos</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.otrosDescuentos}
                        onChange={(e) => setFormData({...formData, otrosDescuentos: e.target.value})}
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
              <button type="submit" className="btn btn-primary">
                Generar y Guardar Comprobante
              </button>
            </div>
          </form>
        </div>
      </div>

      {showComprobante && datosComprobante && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} onClick={(e) => e.stopPropagation()}>
          <ComprobantePago
            {...datosComprobante}
            onClose={() => setShowComprobante(false)}
            onSave={(data) => {
              onSave(data);
              setShowComprobante(false);
              onClose();
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CalculoPagoComprobante;