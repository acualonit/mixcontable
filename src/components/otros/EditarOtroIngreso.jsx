import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function EditarOtroIngreso({ ingreso, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: ingreso.fecha,
    categoria: ingreso.categoria,
    descripcion: ingreso.descripcion,
    sucursal: ingreso.sucursal,
    monto: ingreso.monto.toString(),
    metodoPago: ingreso.metodoPago,
    comprobante: ingreso.comprobante || '',
    incluirFlujoCaja: true,
    observaciones: ingreso.observaciones || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si el método de pago cambió a efectivo y está marcado para incluir en flujo de caja,
    // registrar el movimiento en efectivo
    if (formData.incluirFlujoCaja && formData.metodoPago === 'efectivo' && ingreso.metodoPago !== 'efectivo') {
      try {
        await registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: parseFloat(formData.monto),
          detalle: `Otro ingreso (Editado) - ${formData.categoria}: ${formData.descripcion}`,
          tipo: 'ingreso',
          categoria: 'Otro Ingreso',
          sucursal: formData.sucursal
        });
      } catch (error) {
        alert(error.message);
        return;
      }
    }

    onSave({
      ...ingreso,
      ...formData,
      monto: parseFloat(formData.monto),
      historial: [
        ...ingreso.historial,
        {
          fecha: new Date().toLocaleString(),
          usuario: 'Usuario Actual', // Esto debería venir del contexto de autenticación
          accion: 'Edición',
          detalles: 'Modificación de datos del ingreso'
        }
      ]
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">Editar Ingreso</h5>
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
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="arriendos">Arriendos</option>
                  <option value="inversiones">Inversiones</option>
                  <option value="comisiones">Comisiones</option>
                  <option value="recuperacion">Recuperación de Gastos</option>
                  <option value="otros">Otros</option>
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
                <label className="form-label">Método de Pago</label>
                <select
                  className="form-select"
                  value={formData.metodoPago}
                  onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="deposito">Depósito</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">N° Comprobante</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.comprobante}
                  onChange={(e) => setFormData({...formData, comprobante: e.target.value})}
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

export default EditarOtroIngreso;