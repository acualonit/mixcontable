import React, { useState } from 'react';

function EditarServicioProgramado({ servicio, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ...servicio,
    montoEstimado: servicio.montoEstimado.toString()
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      montoEstimado: parseFloat(formData.montoEstimado)
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">Editar Servicio Programado</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Servicio</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.servicio}
                  onChange={(e) => setFormData({...formData, servicio: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Proveedor</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Día de Pago</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="31"
                  value={formData.diaPago}
                  onChange={(e) => setFormData({...formData, diaPago: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Monto Estimado</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.montoEstimado}
                  onChange={(e) => setFormData({...formData, montoEstimado: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditarServicioProgramado;