import React, { useState } from 'react';

function InactivarCliente({ cliente, onClose, onConfirm }) {
  const [observaciones, setObservaciones] = useState('');
  const usuarioActual = 'Juan Pérez'; // Esto debería venir del contexto de autenticación

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      clienteId: cliente.id,
      observaciones,
      usuario: usuarioActual,
      fecha: new Date().toISOString()
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Inactivar Cliente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                ¿Está seguro que desea inactivar al cliente <strong>{cliente.razonSocial}</strong>?
              </div>

              <div className="mb-3">
                <label className="form-label">Motivo de Inactivación</label>
                <textarea
                  className="form-control"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows="3"
                  required
                  placeholder="Ingrese el motivo de la inactivación"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Usuario que realiza la acción</label>
                <input
                  type="text"
                  className="form-control"
                  value={usuarioActual}
                  disabled
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger">
                Confirmar Inactivación
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InactivarCliente;