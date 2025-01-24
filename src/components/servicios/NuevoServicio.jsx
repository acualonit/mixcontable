import React, { useState, useEffect } from 'react';

function NuevoServicio({ onClose, onSave }) {
  const [valorUF, setValorUF] = useState(35000); // Valor de ejemplo de la UF
  const [montoCalculado, setMontoCalculado] = useState(0);
  const [proveedorBuscado, setProveedorBuscado] = useState(null);
  const [formData, setFormData] = useState({
    rut: '',
    proveedor: '',
    servicio: '',
    sucursal: '',
    montoEstimado: '',
    monedaCobro: 'pesos',
    diaPago: '',
    fechaInicio: '',
    periodoCobro: 'indefinido',
    mesesCobro: '',
    tipoDocumento: '',
    codigoCliente: '',
    metodoPago: 'efectivo',
    datosBancarios: {
      nombreCuenta: '',
      rut: '',
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      correo: ''
    }
  });

  useEffect(() => {
    if (formData.monedaCobro === 'UF') {
      const montoUF = parseFloat(formData.montoEstimado) || 0;
      setMontoCalculado(montoUF * valorUF);
    } else {
      setMontoCalculado(parseFloat(formData.montoEstimado) || 0);
    }
  }, [formData.montoEstimado, formData.monedaCobro, valorUF]);

  const handleBuscarProveedor = () => {
    if (formData.rut) {
      // Simulación de búsqueda de proveedor
      setProveedorBuscado({
        rut: formData.rut,
        razonSocial: 'Empresa Ejemplo SpA',
        direccion: 'Av. Principal 123',
        telefono: '+56 2 2345 6789'
      });
      setFormData(prev => ({
        ...prev,
        proveedor: 'Empresa Ejemplo SpA'
      }));
    }
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
            <h5 className="modal-title">Nuevo Servicio</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Búsqueda de Proveedor */}
              <div className="mb-3">
                <label className="form-label">RUT Proveedor</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={formData.rut}
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    placeholder="Ingrese RUT del proveedor"
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleBuscarProveedor}
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {proveedorBuscado && (
                <div className="alert alert-info mb-3">
                  <h6 className="mb-1">Proveedor encontrado:</h6>
                  <p className="mb-0">
                    <strong>Razón Social:</strong> {proveedorBuscado.razonSocial}<br />
                    <strong>RUT:</strong> {proveedorBuscado.rut}<br />
                    <strong>Dirección:</strong> {proveedorBuscado.direccion}
                  </p>
                </div>
              )}

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Categoría de Servicio</label>
                  <select
                    className="form-select"
                    value={formData.servicio}
                    onChange={(e) => setFormData({...formData, servicio: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar servicio</option>
                    <option value="agua">Agua Potable</option>
                    <option value="energia">Energía Eléctrica</option>
                    <option value="gas">Gas Natural</option>
                    <option value="internet">Internet</option>
                    <option value="gastos_comunes">Gastos Comunes</option>
                  </select>
                </div>
                <div className="col-md-6">
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
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Monto Estimado</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.montoEstimado}
                    onChange={(e) => setFormData({...formData, montoEstimado: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Moneda de Cobro</label>
                  <select
                    className="form-select"
                    value={formData.monedaCobro}
                    onChange={(e) => setFormData({...formData, monedaCobro: e.target.value})}
                    required
                  >
                    <option value="pesos">Pesos</option>
                    <option value="UF">UF</option>
                  </select>
                </div>
              </div>

              {formData.monedaCobro === 'UF' && (
                <div className="alert alert-info mt-2">
                  <small>
                    Valor UF: ${valorUF.toLocaleString()}<br/>
                    Monto en pesos: ${montoCalculado.toLocaleString()}
                  </small>
                </div>
              )}

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Día de Pago del Mes</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="31"
                    value={formData.diaPago}
                    onChange={(e) => setFormData({...formData, diaPago: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fecha de Inicio de Cobros</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Periodo de Cobro</label>
                  <select
                    className="form-select"
                    value={formData.periodoCobro}
                    onChange={(e) => setFormData({...formData, periodoCobro: e.target.value})}
                    required
                  >
                    <option value="indefinido">Indefinido</option>
                    <option value="definido">Definido</option>
                  </select>
                </div>
                {formData.periodoCobro === 'definido' && (
                  <div className="col-md-6">
                    <label className="form-label">Cantidad de Meses</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.mesesCobro}
                      onChange={(e) => setFormData({...formData, mesesCobro: e.target.value})}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Tipo Documento</label>
                  <select
                    className="form-select"
                    value={formData.tipoDocumento}
                    onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="factura_afecta">Factura Afecta</option>
                    <option value="factura_exenta">Factura Exenta</option>
                    <option value="boleta">Boleta</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Código de Cliente</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.codigoCliente}
                    onChange={(e) => setFormData({...formData, codigoCliente: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Método de Pago</label>
                <select
                  className="form-select"
                  value={formData.metodoPago}
                  onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              {formData.metodoPago === 'transferencia' && (
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0">Datos Bancarios</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nombre de Cuenta</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.datosBancarios.nombreCuenta}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {
                              ...formData.datosBancarios,
                              nombreCuenta: e.target.value
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
                      <div className="col-md-6 mb-3">
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
                      <div className="col-md-6 mb-3">
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
                          <option value="ahorro">Cuenta de Ahorro</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
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
                      <div className="col-md-6 mb-3">
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

export default NuevoServicio;