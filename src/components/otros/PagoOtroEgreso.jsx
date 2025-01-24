import React, { useState } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';

function PagoOtroEgreso({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    sucursal: '',
    categoria: '',
    descripcion: '',
    monto: 0,
    metodoPago: {
      tipo: 'efectivo',
      numeroVoucher: '',
      numeroCheque: '',
      fechaCobroCheque: ''
    },
    incluirFlujoCaja: true,
    observaciones: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si el pago es en efectivo y está marcado para incluir en flujo de caja,
    // registrar el movimiento en efectivo
    if (formData.incluirFlujoCaja && formData.metodoPago.tipo === 'efectivo') {
      try {
        await registrarMovimientoEfectivo({
          fecha: formData.fecha,
          valor: formData.monto,
          detalle: `Otro egreso - ${formData.categoria}: ${formData.descripcion}`,
          tipo: 'egreso',
          categoria: 'Otro Egreso',
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
            <h5 className="modal-title">Nuevo Otro Egreso</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Agregar campos del formulario aquí */}
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