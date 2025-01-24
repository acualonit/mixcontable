import React, { useState } from 'react';

function NuevoActivo({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    marca: '',
    modelo: '',
    serie: '',
    fechaAdquisicion: new Date().toISOString().split('T')[0],
    valorCompra: '',
    vidaUtil: '',
    valorResidual: '',
    proveedor: '',
    factura: '',
    sucursal: '',
    ubicacion: '',
    responsable: '',
    estado: 'activo',
    observaciones: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calcular depreciación mensual
    const depreciacionMensual = Math.round(
      (formData.valorCompra - formData.valorResidual) / formData.vidaUtil
    );

    onSave({
      ...formData,
      valorCompra: parseFloat(formData.valorCompra),
      vidaUtil: parseInt(formData.vidaUtil),
      valorResidual: parseFloat(formData.valorResidual),
      depreciacionMensual
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nuevo Activo</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Form content */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Código</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  required
                  rows="2"
                ></textarea>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Equipos">Equipos</option>
                    <option value="Muebles">Muebles</option>
                    <option value="Vehículos">Vehículos</option>
                    <option value="Maquinaria">Maquinaria</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Software">Software</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Marca</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.marca}
                    onChange={(e) => setFormData({...formData, marca: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Modelo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.modelo}
                    onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">N° Serie</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.serie}
                    onChange={(e) => setFormData({...formData, serie: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Fecha de Adquisición</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaAdquisicion}
                    onChange={(e) => setFormData({...formData, fechaAdquisicion: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Valor de Compra</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.valorCompra}
                    onChange={(e) => setFormData({...formData, valorCompra: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Vida Útil (meses)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.vidaUtil}
                    onChange={(e) => setFormData({...formData, vidaUtil: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Valor Residual</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.valorResidual}
                    onChange={(e) => setFormData({...formData, valorResidual: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">N° Factura</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.factura}
                    onChange={(e) => setFormData({...formData, factura: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Proveedor</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                    required
                  />
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
                    <option value="Central">Sucursal Central</option>
                    <option value="Norte">Sucursal Norte</option>
                    <option value="Sur">Sucursal Sur</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Ubicación</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                    required
                    placeholder="Ej: Oficina Principal, Bodega, etc."
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Responsable</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.responsable}
                    onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                    required
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

export default NuevoActivo;