import React, { useState, useEffect } from 'react';
import { REGIONES, getComunasByRegion } from '../../utils/regiones';

function NuevoProveedor({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    razonSocial: '',
    rut: '',
    region: '',
    comuna: '',
    ciudad: '',
    direccion: '',
    nombreComercial: '',
    paginaWeb: '',
    correo: '',
    correoFinanzas: '',
    telefono: '',
    celular: '',
    nombreVendedor: '',
    celularVendedor: '',
    correoVendedor: '',
    comentario: '',
    metodoPago: 'efectivo',
    datosBancarios: {
      nombre: '',
      rut: '',
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      correo: ''
    }
  });

  const [comunasDisponibles, setComunasDisponibles] = useState([]);
  const [mostrarDatosBancarios, setMostrarDatosBancarios] = useState(false);

  useEffect(() => {
    if (formData.region) {
      setComunasDisponibles(getComunasByRegion(parseInt(formData.region)));
    }
  }, [formData.region]);

  useEffect(() => {
    setMostrarDatosBancarios(formData.metodoPago === 'transferencia');
  }, [formData.metodoPago]);

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
            <h5 className="modal-title">Nuevo Proveedor</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Datos principales */}
              <div className="row mb-3">
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
              </div>

              {/* Ubicación */}
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

              {/* Información comercial */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre Comercial</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombreComercial}
                    onChange={(e) => setFormData({...formData, nombreComercial: e.target.value})}
                  />
                </div>
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

              {/* Contacto empresa */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Correo</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.correo}
                    onChange={(e) => setFormData({...formData, correo: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Correo Finanzas</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.correoFinanzas}
                    onChange={(e) => setFormData({...formData, correoFinanzas: e.target.value})}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Celular</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.celular}
                    onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  />
                </div>
              </div>

              {/* Datos del vendedor */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Nombre del Vendedor</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombreVendedor}
                    onChange={(e) => setFormData({...formData, nombreVendedor: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Celular del Vendedor</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.celularVendedor}
                    onChange={(e) => setFormData({...formData, celularVendedor: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Correo del Vendedor</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.correoVendedor}
                    onChange={(e) => setFormData({...formData, correoVendedor: e.target.value})}
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div className="mb-3">
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

              {/* Datos bancarios (solo si es transferencia) */}
              {mostrarDatosBancarios && (
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0">Datos Bancarios</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nombre</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.datosBancarios.nombre}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              nombre: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">RUT</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.datosBancarios.rut}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              rut: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Banco</label>
                        <select
                          className="form-select"
                          value={formData.datosBancarios.banco}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              banco: e.target.value
                            }
                          })}
                          required
                        >
                          <option value="">Seleccionar banco</option>
                          <option value="banco_estado">Banco Estado</option>
                          <option value="banco_chile">Banco de Chile</option>
                          <option value="banco_santander">Banco Santander</option>
                          <option value="banco_bci">Banco BCI</option>
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Tipo de Cuenta</label>
                        <select
                          className="form-select"
                          value={formData.datosBancarios.tipoCuenta}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              tipoCuenta: e.target.value
                            }
                          })}
                          required
                        >
                          <option value="">Seleccionar tipo</option>
                          <option value="corriente">Cuenta Corriente</option>
                          <option value="vista">Cuenta Vista</option>
                          <option value="cuenta_rut">Cuenta RUT</option>
                          <option value="chequera_electronica">Chequera Electrónica</option>
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Número de Cuenta</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.datosBancarios.numeroCuenta}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              numeroCuenta: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Correo</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.datosBancarios.correo}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              correo: e.target.value
                            }
                          })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comentarios */}
              <div className="mb-3">
                <label className="form-label">Comentarios</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.comentario}
                  onChange={(e) => setFormData({...formData, comentario: e.target.value})}
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

export default NuevoProveedor;