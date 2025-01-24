import React, { useState } from 'react';

function NuevaCategoria({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombreServicio: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nueva Categoría de Servicio</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre del Servicio</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nombreServicio}
                  onChange={(e) => setFormData({...formData, nombreServicio: e.target.value})}
                  required
                  placeholder="Ej: Agua Potable, Energía Eléctrica, etc."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaCategoria;