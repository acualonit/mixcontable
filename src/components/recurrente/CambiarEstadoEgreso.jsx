import React, { useState } from 'react';

function CambiarEstadoEgreso({ egreso, onClose, onSave }) {
  const [formData, setFormData] = useState({
    estado: egreso.estado,
    observaciones: '',
    usuario: 'Usuario Actual' // Esto debería venir del contexto de autenticación
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      fechaCambio: new Date().toISOString(),
      egresoId: egreso.id
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">Cambiar Estado del Egreso</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Cuenta:</strong> {egreso.nombreCuenta}<br />
                <strong>Estado Actual:</strong> {egreso.estado.charAt(0).toUpperCase() + egreso.estado.slice(1)}
              </div>

              <div className="mb-3">
                <label className="form-label">Nuevo Estado</label>
                <select
                  className="form-select"
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  required
                >
                  <option value="vigente_pago">Vigente de Pago</option>
                  <option value="descartar_pago">Descartar Pago</option>
                  <option value="pagado">Pagado</option>
                </select>
                <small className="text-muted">
                  {formData.estado === 'descartar_pago' && 
                    'La cuenta no aparecerá en la tabla de Egresos Recurrentes'}
                  {formData.estado === 'pagado' && 
                    'La cuenta no aparecerá en la tabla de Egresos Recurrentes'}
                  {formData.estado === 'vigente_pago' && 
                    'La cuenta aparecerá en la tabla de Egresos Recurrentes'}
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  rows="3"
                  required
                  placeholder="Indique el motivo del cambio de estado"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Usuario que realiza el cambio</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.usuario}
                  disabled
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-warning">
                Guardar Cambio
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CambiarEstadoEgreso;