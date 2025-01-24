import React, { useState } from 'react';

function MantenimientoActivo({ activo, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'preventivo',
    descripcion: '',
    proveedor: '',
    costo: '',
    estado: 'pendiente',
    fechaProximoMantenimiento: '',
    observaciones: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      costo: parseFloat(formData.costo),
      activoId: activo.id,
      usuario: 'Usuario Actual' // Esto debería venir del contexto de autenticación
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Registrar Mantenimiento</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Activo:</strong> {activo.nombre}<br />
                <strong>Código:</strong> {activo.codigo}<br />
                <strong>Categoría:</strong> {activo.categoria}
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tipo de Mantenimiento</label>
                  <select
                    className="form-select"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="preventivo">Preventivo</option>
                    <option value="correctivo">Correctivo</option>
                    <option value="predictivo">Predictivo</option>
                    <option value="mejora">Mejora</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción del Mantenimiento</label>
                <textarea
                  className="form-control"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Proveedor del Servicio</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Costo</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.costo}
                    onChange={(e) => setFormData({...formData, costo: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Próximo Mantenimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaProximoMantenimiento}
                    onChange={(e) => setFormData({...formData, fechaProximoMantenimiento: e.target.value})}
                  />
                </div>
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

export default MantenimientoActivo;