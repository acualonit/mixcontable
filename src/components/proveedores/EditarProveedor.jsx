import React, { useState, useEffect } from 'react';
import { REGIONES, getComunasByRegion } from '../../utils/regiones';

function EditarProveedor({ proveedor, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: proveedor.id,
    rut: proveedor.rut,
    razonSocial: proveedor.razonSocial,
    nombreFantasia: proveedor.nombreFantasia || '',
    giro: proveedor.giro || '',
    paginaWeb: proveedor.pagina_web || proveedor.paginaWeb || '',
    region: proveedor.region || '',
    comuna: proveedor.comuna || '',
    direccion: proveedor.direccion,
    ciudad: proveedor.ciudad,
    contactoPrincipal: proveedor.contactoPrincipal,
    telefonoPrincipal: proveedor.telefonoPrincipal || proveedor.telefono || '',
    emailPrincipal: proveedor.emailPrincipal || proveedor.correo || '',
    contactoPagos: proveedor.nombre_vendedor || '',
    telefonoPagos: proveedor.celular_vendedor || '',
    emailPagos: proveedor.correo_vendedor || '',
      metodoPago: proveedor.metodoPago || proveedor.metodo_pago || 'efectivo',
    limiteCredito: proveedor.limiteCredito?.toString() || '',
    observaciones: proveedor.observacion || proveedor.comentario || ''
  });

  const [comunasDisponibles, setComunasDisponibles] = useState([]);

  useEffect(() => {
    if (formData.region) {
      setComunasDisponibles(getComunasByRegion(parseInt(formData.region)));
    }
  }, [formData.region]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      limiteCredito: parseFloat(formData.limiteCredito)
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">Editar Proveedor</h5>
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
                    readOnly
                    tabIndex="-1"
                    aria-readonly="true"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Razón Social</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.razonSocial}
                    readOnly
                    tabIndex="-1"
                    aria-readonly="true"
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
                    onChange={(e) => setFormData({...formData, nombreFantasia: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Giro</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.giro}
                    onChange={(e) => setFormData({...formData, giro: e.target.value})}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Página Web</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formData.paginaWeb}
                    onChange={(e) => setFormData({...formData, paginaWeb: e.target.value})}
                    placeholder="https://www.ejemplo.com"
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Región</label>
                  <select
                    className="form-select"
                    value={formData.region}
                    onChange={(e) => {
                      const regionId = e.target.value;
                      setFormData({
                        ...formData,
                        region: regionId,
                        comuna: ''
                      });
                      setComunasDisponibles(regionId ? getComunasByRegion(parseInt(regionId)) : []);
                    }}
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

              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  required
                />
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
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.emailPrincipal}
                    onChange={(e) => setFormData({...formData, emailPrincipal: e.target.value})}
                  />
                </div>
              </div>

              <h6 className="mb-3">Contacto de Pagos</h6>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.contactoPagos}
                    onChange={(e) => setFormData({...formData, contactoPagos: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.telefonoPagos}
                    onChange={(e) => setFormData({...formData, telefonoPagos: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.emailPagos}
                    onChange={(e) => setFormData({...formData, emailPagos: e.target.value})}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                    <label className="form-label">Método de Pago</label>
                    <select
                      className="form-select"
                      value={formData.metodoPago}
                      onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                      required
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="cheque">Cheque</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Límite de Crédito</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.limiteCredito}
                    onChange={(e) => setFormData({...formData, limiteCredito: e.target.value})}
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
              <button type="submit" className="btn btn-warning">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditarProveedor;