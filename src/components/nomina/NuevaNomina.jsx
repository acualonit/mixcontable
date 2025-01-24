import React, { useState } from 'react';

function NuevaNomina({ onClose, onSave, periodo }) {
  const [formData, setFormData] = useState({
    empleado: '',
    cargo: '',
    sueldoBase: '',
    bonificaciones: '',
    descuentos: '',
    observaciones: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalPago = parseFloat(formData.sueldoBase) + 
                     parseFloat(formData.bonificaciones) - 
                     parseFloat(formData.descuentos);
    
    onSave({
      ...formData,
      sueldoBase: parseFloat(formData.sueldoBase),
      bonificaciones: parseFloat(formData.bonificaciones),
      descuentos: parseFloat(formData.descuentos),
      totalPago,
      estado: 'pendiente',
      periodo
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Nueva Nómina</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Empleado</label>
                <select
                  className="form-select"
                  value={formData.empleado}
                  onChange={(e) => setFormData({...formData, empleado: e.target.value})}
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  <option value="Juan Pérez">Juan Pérez</option>
                  <option value="María González">María González</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Cargo</label>
                <select
                  className="form-select"
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  required
                >
                  <option value="">Seleccionar cargo</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Gerente">Gerente</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Sueldo Base</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.sueldoBase}
                  onChange={(e) => setFormData({...formData, sueldoBase: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Bonificaciones</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.bonificaciones}
                  onChange={(e) => setFormData({...formData, bonificaciones: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Descuentos</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.descuentos}
                  onChange={(e) => setFormData({...formData, descuentos: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaNomina;