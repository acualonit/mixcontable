import React, { useState } from 'react';
import { REGIONES, getComunasByRegion } from '../../utils/regiones';

function NuevoCliente({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    rut: '',
    razonSocial: '',
    nombreFantasia: '',
    giro: '',
    direccion: '',
    region: '',
    comuna: '',
    ciudad: '',
    contactoPrincipal: '',
    telefonoPrincipal: '',
    emailPrincipal: '',
    contactoCobranza: '',
    telefonoCobranza: '',
    emailCobranza: '',
    condicionVenta: '30',
    limiteCredito: '',
    observaciones: ''
  });

  const [comunasDisponibles, setComunasDisponibles] = useState([]);

  const handleRegionChange = (e) => {
    const regionId = parseInt(e.target.value);
    setFormData({
      ...formData,
      region: regionId,
      comuna: '' // Reset comuna when region changes
    });
    setComunasDisponibles(regionId ? getComunasByRegion(regionId) : []);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nuevo Cliente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">RUT</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.rut}
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    required
                    placeholder="12.345.678-9"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Razón Social</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.razonSocial}
                    onChange={(e) => setFormData({...formData, razonSocial: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre de Fantasía</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombreFantasia}
                    onChange={(e) => setFormData({...formData, nombreFantasia: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Giro</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.giro}
                    onChange={(e) => setFormData({...formData, giro: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Región</label>
                  <select
                    className="form-select"
                    value={formData.region}
                    onChange={handleRegionChange}
                    required
                  >
                    <option value="">Seleccionar región</option>
                    {REGIONES.map(region => (
                      <option key={region.id} value={region.id}>
                        {region.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Comuna</label>
                  <select
                    className="form-select"
                    value={formData.comuna}
                    onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                    required
                    disabled={!formData.region}
                  >
                    <option value="">Seleccionar comuna</option>
                    {comunasDisponibles.map(comuna => (
                      <option key={comuna} value={comuna}>
                        {comuna}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Ciudad</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                    required
                  />
                </div>
              </div>

              <h6 className="mb-3">Contacto Principal</h6>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.contactoPrincipal}
                    onChange={(e) => setFormData({...formData, contactoPrincipal: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.telefonoPrincipal}
                    onChange={(e) => setFormData({...formData, telefonoPrincipal: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.emailPrincipal}
                    onChange={(e) => setFormData({...formData, emailPrincipal: e.target.value})}
                    required
                  />
                </div>
              </div>

              <h6 className="mb-3">Contacto Cobranza</h6>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.contactoCobranza}
                    onChange={(e) => setFormData({...formData, contactoCobranza: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.telefonoCobranza}
                    onChange={(e) => setFormData({...formData, telefonoCobranza: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.emailCobranza}
                    onChange={(e) => setFormData({...formData, emailCobranza: e.target.value})}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Condición de Venta (días)</label>
                  <select
                    className="form-select"
                    value={formData.condicionVenta}
                    onChange={(e) => setFormData({...formData, condicionVenta: e.target.value})}
                    required
                  >
                    <option value="0">Contado</option>
                    <option value="30">30 días</option>
                    <option value="45">45 días</option>
                    <option value="60">60 días</option>
                    <option value="90">90 días</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Límite de Crédito</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.limiteCredito}
                    onChange={(e) => setFormData({...formData, limiteCredito: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  rows="3"
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

export default NuevoCliente;