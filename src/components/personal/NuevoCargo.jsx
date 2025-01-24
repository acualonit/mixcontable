import React, { useState } from 'react';

function NuevoCargo({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    departamento: '',
    descripcion: '',
    requisitos: '',
    responsabilidades: '',
    estado: 'activo'
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
            <h5 className="modal-title">Nuevo Cargo</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre del Cargo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                  placeholder="Ej: Gerente de Ventas"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Departamento</label>
                <select
                  className="form-select"
                  value={formData.departamento}
                  onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                  required
                >
                  <option value="">Seleccionar departamento</option>
                  <option value="Administración">Administración</option>
                  <option value="Ventas">Ventas</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Finanzas">Finanzas</option>
                  <option value="Logística">Logística</option>
                  <option value="Marketing">Marketing</option>
                  <option value="TI">TI</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción del Cargo</label>
                <textarea
                  className="form-control"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  required
                  rows="3"
                  placeholder="Descripción general del cargo y sus funciones principales"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Requisitos</label>
                <textarea
                  className="form-control"
                  value={formData.requisitos}
                  onChange={(e) => setFormData({...formData, requisitos: e.target.value})}
                  required
                  rows="3"
                  placeholder="Requisitos necesarios para el cargo (educación, experiencia, habilidades)"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Responsabilidades</label>
                <textarea
                  className="form-control"
                  value={formData.responsabilidades}
                  onChange={(e) => setFormData({...formData, responsabilidades: e.target.value})}
                  required
                  rows="3"
                  placeholder="Principales responsabilidades y tareas del cargo"
                ></textarea>
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
                  <option value="inactivo">Inactivo</option>
                </select>
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

export default NuevoCargo;