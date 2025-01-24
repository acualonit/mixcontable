import React, { useState } from 'react';

function NuevoMovimiento({ onClose, onSave, cuentas }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'ingreso',
    categoria: '',
    descripcion: '',
    monto: '',
    sucursal: '',
    cuenta: '',
    referencia: '',
    observaciones: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nuevo Movimiento Bancario</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="deposito">Depósito Bancario</option>
                  <option value="transbank">Transbank</option>
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
                <label className="form-label">Monto</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Sucursal</label>
                <select
                  className="form-select"
                  value={formData.sucursal}
                  onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                  required
                >
                  <option value="">Seleccionar sucursal</option>
                  <option value="central">Sucursal Central</option>
                  <option value="norte">Sucursal Norte</option>
                  <option value="sur">Sucursal Sur</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Cuenta</label>
                <select
                  className="form-select"
                  value={formData.cuenta}
                  onChange={(e) => setFormData({...formData, cuenta: e.target.value})}
                  required
                >
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(cuenta => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.banco} - {cuenta.numeroCuenta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Referencia</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.referencia}
                  onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
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

export default NuevoMovimiento;