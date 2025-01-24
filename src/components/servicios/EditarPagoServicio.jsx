import React, { useState } from 'react';

function EditarPagoServicio({ servicio, onClose, onSave }) {
  const [formData, setFormData] = useState({
    montoReal: servicio.montoReal || servicio.montoEstimado,
    fechaPago: new Date().toISOString().split('T')[0],
    comprobante: '',
    observaciones: ''
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
          <div className="modal-header bg-warning">
            <h5 className="modal-title">Editar Pago del Mes</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Servicio:</strong> {servicio.servicio}<br />
                <strong>Proveedor:</strong> {servicio.proveedor}<br />
                <strong>Monto Estimado:</strong> ${servicio.montoEstimado.toLocaleString()}
              </div>

              <div className="mb-3">
                <label className="form-label">Monto Real</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.montoReal}
                  onChange={(e) => setFormData({...formData, montoReal: parseFloat(e.target.value)})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Fecha de Pago</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaPago}
                  onChange={(e) => setFormData({...formData, fechaPago: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">N° Comprobante</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.comprobante}
                  onChange={(e) => setFormData({...formData, comprobante: e.target.value})}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  rows="2"
                ></textarea>
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

export default EditarPagoServicio;