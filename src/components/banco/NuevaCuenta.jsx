import React, { useState } from 'react';

function NuevaCuenta({ onClose, onSave, sucursales = [] }) {
  const [formData, setFormData] = useState({
    banco: '',
    tipoCuenta: '',
    numeroCuenta: '',
    id_sucursal: '',
    saldoInicial: 0,
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
            <h5 className="modal-title">Nueva Cuenta Bancaria</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Banco</label>
                <select
                  className="form-select"
                  value={formData.banco}
                  onChange={(e) => setFormData({...formData, banco: e.target.value})}
                  required
                >
                  <option value="">Seleccionar banco</option>
                  <option value="banco_estado">Banco Estado</option>
                  <option value="banco_chile">Banco de Chile</option>
                  <option value="banco_santander">Banco Santander</option>
                  <option value="banco_bci">Banco BCI</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Tipo de Cuenta</label>
                <select
                  className="form-select"
                  value={formData.tipoCuenta}
                  onChange={(e) => setFormData({...formData, tipoCuenta: e.target.value})}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="corriente">Cuenta Corriente</option>
                  <option value="vista">Cuenta Vista</option>
                  <option value="ahorro">Cuenta de Ahorro</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Número de Cuenta</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.numeroCuenta}
                  onChange={(e) => setFormData({...formData, numeroCuenta: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Sucursal</label>
                <select
                  className="form-select"
                  value={formData.id_sucursal}
                  onChange={(e) => setFormData({...formData, id_sucursal: e.target.value})}
                  required
                >
                  <option value="">Seleccionar sucursal</option>
                  {sucursales.length > 0 ? (
                    sucursales.map(s => {
                      // defensivo: soportar varias formas del objeto sucursal
                      const id = s?.id ?? s?.id_sucursal ?? s?.value ?? s?.key ?? (s?.original && (s.original.id ?? s.original.ID)) ?? String(s);
                      const nombre = s?.nombre ?? s?.name ?? s?.sucursal_nombre ?? s?.nombre_sucursal ?? s?.label ?? (s?.original && (s.original.nombre || s.original.name || s.original.sucursal_nombre)) ?? String(s);
                      return (
                        <option key={id} value={id}>{nombre}</option>
                      );
                    })
                  ) : (
                    // No mostrar sucursales por defecto; indicar que no hay sucursales cargadas
                    <option value="">No hay sucursales cargadas</option>
                  )}
                </select>
                {/* Depuración: mostrar en consola las sucursales recibidas */}
                {process.env.NODE_ENV !== 'production' && console.debug && console.debug('NuevaCuenta sucursales prop:', sucursales)}
              </div>

              <div className="mb-3">
                <label className="form-label">Saldo Inicial</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.saldoInicial}
                  onChange={(e) => setFormData({...formData, saldoInicial: parseFloat(e.target.value || 0)})}
                  required
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

export default NuevaCuenta;