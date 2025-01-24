import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function NuevoCheque({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    tipo: 'emitido',
    banco: '',
    numeroCheque: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaCobro: '',
    monto: '',
    origenDestino: '',
    sucursal: '',
    concepto: '',
    incluirFlujoCaja: true,
    observaciones: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si es un cheque emitido y está marcado para incluir en flujo de caja,
    // registrar el movimiento en efectivo
    if (formData.incluirFlujoCaja && formData.tipo === 'emitido') {
      try {
        await registrarMovimientoEfectivo({
          fecha: formData.fechaEmision,
          valor: formData.monto,
          detalle: `Cheque emitido N° ${formData.numeroCheque} - ${formData.concepto}`,
          tipo: 'egreso',
          categoria: 'Cheque',
          sucursal: formData.sucursal
        });
      } catch (error) {
        alert(error.message);
        return;
      }
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nuevo Cheque</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Tipo de Cheque</label>
                  <select
                    className="form-select"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="emitido">Emitido</option>
                    <option value="recibido">Recibido</option>
                  </select>
                </div>
                <div className="col-md-6">
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
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Número de Cheque</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numeroCheque}
                    onChange={(e) => setFormData({...formData, numeroCheque: e.target.value})}
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
                    <option value="central">Sucursal Central</option>
                    <option value="norte">Sucursal Norte</option>
                    <option value="sur">Sucursal Sur</option>
                  </select>
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
                  <label className="form-label">Fecha de Cobro</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaCobro}
                    onChange={(e) => setFormData({...formData, fechaCobro: e.target.value})}
                    required
                  />
                </div>
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
                <label className="form-label">
                  {formData.tipo === 'emitido' ? 'Destinatario' : 'Origen'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.origenDestino}
                  onChange={(e) => setFormData({...formData, origenDestino: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Concepto</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.concepto}
                  onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                  required
                />
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="incluirFlujoCaja"
                    checked={formData.incluirFlujoCaja}
                    onChange={(e) => setFormData({...formData, incluirFlujoCaja: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="incluirFlujoCaja">
                    Incluir en el Flujo de Caja
                  </label>
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

export default NuevoCheque;