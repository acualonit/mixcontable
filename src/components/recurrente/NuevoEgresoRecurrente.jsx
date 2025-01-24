import React, { useState } from 'react';
import { DOCUMENT_TYPES } from '../../utils/documentTypes';

function NuevoEgresoRecurrente({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    rut: '',
    proveedor: '',
    categoria: '',
    // Campos comunes
    nombreCuenta: '',
    unidadCobro: 'pesos',
    valorCuotaMensual: '',
    diasPago: '',
    // Campos específicos por categoría
    // Compra de Activo
    fechaCompra: '',
    valorActivo: '',
    clasificacionActivo: '',
    cantidadCuotas: '',
    nombreActivo: '',
    modeloActivo: '',
    marcaActivo: '',
    referenciaActivo: '',
    fechaInicioPago: '',
    mismoProveedor: 'si',
    proveedorFinanciador: '',
    // Arriendo de Local
    fechaInicioArriendo: '',
    direccionPropiedad: '',
    // Deuda con Bancos
    fechaObligacion: '',
    valorDeuda: '',
    clasificacionDeuda: '',
    descripcionDeuda: '',
    // Leasing
    fechaLeasing: '',
    valorLeasing: '',
    // Campos de documento
    tipoDocumento: '',
    // Otros campos
    observaciones: ''
  });

  const [proveedorBuscado, setProveedorBuscado] = useState(null);
  const valorUF = 35000; // Valor de ejemplo de la UF

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

  const renderCamposEspecificos = () => {
    switch (formData.categoria) {
      case 'compra_activos':
        return (
          <>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de Compra</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaCompra}
                  onChange={(e) => setFormData({...formData, fechaCompra: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Unidad de Cobro Mensual</label>
                <select
                  className="form-select"
                  value={formData.unidadCobro}
                  onChange={(e) => setFormData({...formData, unidadCobro: e.target.value})}
                  required
                >
                  <option value="pesos">Pesos</option>
                  <option value="uf">UF</option>
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Valor del Activo</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorActivo}
                  onChange={(e) => setFormData({...formData, valorActivo: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Valor Cuota Mensual</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorCuotaMensual}
                  onChange={(e) => setFormData({...formData, valorCuotaMensual: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Clasificación</label>
                <select
                  className="form-select"
                  value={formData.clasificacionActivo}
                  onChange={(e) => setFormData({...formData, clasificacionActivo: e.target.value})}
                  required
                >
                  <option value="">Seleccionar clasificación</option>
                  <option value="maquinaria">Maquinaria de Fabricación</option>
                  <option value="bienes_muebles">Bienes Muebles</option>
                  <option value="equipos_oficina">Equipos de Oficina</option>
                  <option value="propiedad_intangible">Propiedad Intangible</option>
                  <option value="equipos_informaticos">Equipos Informáticos</option>
                  <option value="equipos_terceros">Equipos de Terceros</option>
                  <option value="equipos_activos">Equipos Activos Fijos</option>
                  <option value="mobiliario_oficina">Mobiliario de Oficina</option>
                  <option value="mobiliario_locales">Mobiliario de Locales</option>
                  <option value="equipos_esenciales">Equipos Esenciales</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Cantidad de Cuotas</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.cantidadCuotas}
                  onChange={(e) => setFormData({...formData, cantidadCuotas: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Días de Pago</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="31"
                  value={formData.diasPago}
                  onChange={(e) => setFormData({...formData, diasPago: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Fecha de Inicio de Pago</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaInicioPago}
                  onChange={(e) => setFormData({...formData, fechaInicioPago: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Nombre del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nombreActivo}
                  onChange={(e) => setFormData({...formData, nombreActivo: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Modelo del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.modeloActivo}
                  onChange={(e) => setFormData({...formData, modeloActivo: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Marca del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.marcaActivo}
                  onChange={(e) => setFormData({...formData, marcaActivo: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Referencia del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.referenciaActivo}
                  onChange={(e) => setFormData({...formData, referenciaActivo: e.target.value})}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">¿El mismo proveedor de venta es el financiador?</label>
              <select
                className="form-select"
                value={formData.mismoProveedor}
                onChange={(e) => setFormData({...formData, mismoProveedor: e.target.value})}
                required
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

            {formData.mismoProveedor === 'no' && (
              <div className="mb-3">
                <label className="form-label">Proveedor Financiador</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.proveedorFinanciador}
                  onChange={(e) => setFormData({...formData, proveedorFinanciador: e.target.value})}
                  required
                />
              </div>
            )}
          </>
        );

      case 'arriendo':
        return (
          <>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de Inicio del Arriendo</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaInicioArriendo}
                  onChange={(e) => setFormData({...formData, fechaInicioArriendo: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Unidad de Cobro Mensual</label>
                <select
                  className="form-select"
                  value={formData.unidadCobro}
                  onChange={(e) => setFormData({...formData, unidadCobro: e.target.value})}
                  required
                >
                  <option value="pesos">Pesos</option>
                  <option value="uf">UF</option>
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Valor Cuota Mensual</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorCuotaMensual}
                  onChange={(e) => setFormData({...formData, valorCuotaMensual: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Días de Pago</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="31"
                  value={formData.diasPago}
                  onChange={(e) => setFormData({...formData, diasPago: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Dirección de la Propiedad</label>
              <input
                type="text"
                className="form-control"
                value={formData.direccionPropiedad}
                onChange={(e) => setFormData({...formData, direccionPropiedad: e.target.value})}
                required
              />
            </div>
          </>
        );

      case 'deuda_bancos':
        return (
          <>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de Obligación Financiera</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaObligacion}
                  onChange={(e) => setFormData({...formData, fechaObligacion: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Unidad de Cobro Mensual</label>
                <select
                  className="form-select"
                  value={formData.unidadCobro}
                  onChange={(e) => setFormData({...formData, unidadCobro: e.target.value})}
                  required
                >
                  <option value="pesos">Pesos</option>
                  <option value="uf">UF</option>
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Valor Deuda</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorDeuda}
                  onChange={(e) => setFormData({...formData, valorDeuda: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Valor Cuota Mensual</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorCuotaMensual}
                  onChange={(e) => setFormData({...formData, valorCuotaMensual: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Cantidad de Cuotas</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.cantidadCuotas}
                  onChange={(e) => setFormData({...formData, cantidadCuotas: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Días de Pago</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="31"
                  value={formData.diasPago}
                  onChange={(e) => setFormData({...formData, diasPago: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Clasificación</label>
                <select
                  className="form-select"
                  value={formData.clasificacionDeuda}
                  onChange={(e) => setFormData({...formData, clasificacionDeuda: e.target.value})}
                  required
                >
                  <option value="">Seleccionar clasificación</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                  <option value="credito_bancario">Crédito Bancario</option>
                  <option value="credito_socios">Crédito Socios</option>
                  <option value="linea_credito">Línea de Crédito</option>
                  <option value="otras_deudas">Otras Deudas</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Descripción de la Deuda</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.descripcionDeuda}
                  onChange={(e) => setFormData({...formData, descripcionDeuda: e.target.value})}
                  required
                />
              </div>
            </div>
          </>
        );

      case 'leasing':
        return (
          <>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de Leasing</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaLeasing}
                  onChange={(e) => setFormData({...formData, fechaLeasing: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Unidad de Cobro Mensual</label>
                <select
                  className="form-select"
                  value={formData.unidadCobro}
                  onChange={(e) => setFormData({...formData, unidadCobro: e.target.value})}
                  required
                >
                  <option value="pesos">Pesos</option>
                  <option value="uf">UF</option>
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Valor del Leasing</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorLeasing}
                  onChange={(e) => setFormData({...formData, valorLeasing: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Valor Cuota Mensual</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorCuotaMensual}
                  onChange={(e) => setFormData({...formData, valorCuotaMensual: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Cantidad de Cuotas</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.cantidadCuotas}
                  onChange={(e) => setFormData({...formData, cantidadCuotas: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Días de Pago</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="31"
                  value={formData.diasPago}
                  onChange={(e) => setFormData({...formData, diasPago: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Nombre del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nombreActivo}
                  onChange={(e) => setFormData({...formData, nombreActivo: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Modelo del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.modeloActivo}
                  onChange={(e) => setFormData({...formData, modeloActivo: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Marca del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.marcaActivo}
                  onChange={(e) => setFormData({...formData, marcaActivo: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Referencia del Activo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.referenciaActivo}
                  onChange={(e) => setFormData({...formData, referenciaActivo: e.target.value})}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de Inicio de Pago</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaInicioPago}
                  onChange={(e) => setFormData({...formData, fechaInicioPago: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">¿El mismo proveedor de venta es el financiador?</label>
              <select
                className="form-select"
                value={formData.mismoProveedor}
                onChange={(e) => setFormData({...formData, mismoProveedor: e.target.value})}
                required
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

            {formData.mismoProveedor === 'no' && (
              <div className="mb-3">
                <label className="form-label">Proveedor Financiador</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.proveedorFinanciador}
                  onChange={(e) => setFormData({...formData, proveedorFinanciador: e.target.value})}
                  required
                />
              </div>
            )}
          </>
        );

      case 'otros':
        return (
          <>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de Obligación Financiera</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaObligacion}
                  onChange={(e) => setFormData({...formData, fechaObligacion: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Unidad de Cobro Mensual</label>
                <select
                  className="form-select"
                  value={formData.unidadCobro}
                  onChange={(e) => setFormData({...formData, unidadCobro: e.target.value})}
                  required
                >
                  <option value="pesos">Pesos</option>
                  <option value="uf">UF</option>
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Valor Deuda</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorDeuda}
                  onChange={(e) => setFormData({...formData, valorDeuda: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Valor Cuota Mensual</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.valorCuotaMensual}
                  onChange={(e) => setFormData({...formData, valorCuotaMensual: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Cantidad de Cuotas</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.cantidadCuotas}
                  onChange={(e) => setFormData({...formData, cantidadCuotas: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Días de Pago</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="31"
                  value={formData.diasPago}
                  onChange={(e) => setFormData({...formData, diasPago: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Descripción de la Deuda</label>
              <textarea
                className="form-control"
                value={formData.descripcionDeuda}
                onChange={(e) => setFormData({...formData, descripcionDeuda: e.target.value})}
                rows="3"
                required
              ></textarea>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nuevo Egreso Recurrente</h5>
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
                    <strong>Dirección:</strong> {proveedorBuscado.direccion}<br />
                    <strong>Teléfono:</strong> {proveedorBuscado.telefono}
                  </p>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="compra_activos">Compra de Activos</option>
                  <option value="arriendo">Arriendo de Local</option>
                  <option value="deuda_bancos">Deuda con Bancos</option>
                  <option value="leasing">Leasing</option>
                  <option value="otros">Otros Pagos</option>
                </select>
              </div>

              {formData.categoria && (
                <div className="mb-3">
                  <label className="form-label">Nombre detallado de la cuenta</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombreCuenta}
                    onChange={(e) => setFormData({...formData, nombreCuenta: e.target.value})}
                    required
                  />
                </div>
              )}

              {renderCamposEspecificos()}

              {formData.categoria && (
                <div className="mb-3">
                  <label className="form-label">Tipo de Documento</label>
                  <select
                    className="form-select"
                    value={formData.tipoDocumento}
                    onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar tipo de documento</option>
                    {Object.values(DOCUMENT_TYPES).map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.unidadCobro === 'uf' && (
                <div className="alert alert-info mt-2">
                  <small>
                    Valor UF: ${valorUF.toLocaleString()}<br/>
                    Monto en pesos: ${(parseFloat(formData.valorCuotaMensual || 0) * valorUF).toLocaleString()}
                  </small>
                </div>
              )}

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
              <button type="button" className="btn btn-secondary" onClick={ onClose}>
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

export default NuevoEgresoRecurrente;