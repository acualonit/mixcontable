import React, { useState } from 'react';

function EditarEgresoRecurrente({ egreso, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ...egreso,
    monto: egreso.monto.toString()
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      monto: parseFloat(formData.monto)
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">Editar Egreso Recurrente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="deuda_bancos">Deuda con Bancos</option>
                  <option value="leasing">Leasing</option>
                  <option value="arriendo">Arriendo de Locales</option>
                  <option value="activos">Compra de Activos</option>
                  <option value="otros">Otros Pagos</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Monto Mensual</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
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

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fecha de Fin</label>
                  <input
                    type="date"
                     className="form-control"
                    value={formData.fechaFin || ''}
                    onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  required
                >
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                ></textarea>
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

export default EditarEgresoRecurrente;