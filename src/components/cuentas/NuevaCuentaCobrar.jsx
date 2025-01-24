import React, { useState } from 'react';

function NuevaCuentaCobrar({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    cliente: '',
    rut: '',
    tipoDocumento: '',
    numeroDocumento: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    montoTotal: '',
    observaciones: ''
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
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Nueva Cuenta por Cobrar</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">RUT Cliente</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={formData.rut}
                      onChange={(e) => setFormData({...formData, rut: e.target.value})}
                      required
                    />
                    <button type="button" className="btn btn-primary">
                      Buscar
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Cliente</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.cliente}
                    onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Tipo de Documento</label>
                  <select
                    className="form-select"
                    value={formData.tipoDocumento}
                    onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="factura_afecta">Factura Afecta a IVA</option>
                    <option value="factura_exenta">Factura Exenta a IVA</option>
                    <option value="boleta_afecta">Boleta Afecta IVA</option>
                    <option value="boleta_exenta">Boleta Exenta a IVA</option>
                    <option value="boleta_honorarios">Boleta de Honorarios</option>
                    <option value="voucher_credito">Voucher Tarjeta Crédito</option>
                    <option value="voucher_debito">Voucher Tarjeta Débito</option>
                    <option value="otro">Otro Documento</option>
                    <option value="sin_documento">Sin Documento</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Número de Documento</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numeroDocumento}
                    onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})}
                    required={formData.tipoDocumento !== 'sin_documento'}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Fecha de Emisión</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaEmision}
                    onChange={(e) => setFormData({...formData, fechaEmision: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({...formData, fechaVencimiento: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Monto Total</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.montoTotal}
                  onChange={(e) => setFormData({...formData, montoTotal: e.target.value})}
                  required
                />
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
              <button type="submit" className="btn btn-success">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaCuentaCobrar;