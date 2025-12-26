import React, { useState, useEffect } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';
import { createCheque, updateCheque } from '../../utils/chequesApi';
import { fetchSucursales, fetchCuentas } from '../../utils/bancoApi';

function NuevoCheque({ onClose, onSave, initialData = null }) {
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
    estado: 'Pendiente',
    incluirFlujoCaja: true,
    observaciones: ''
  });

  const [sucursales, setSucursales] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [resSuc, resCtas] = await Promise.all([fetchSucursales(), fetchCuentas()]);
        const list = resSuc?.data ?? resSuc ?? [];
        const ctas = resCtas?.data ?? resCtas ?? [];
        setSucursales(list);
        setCuentas(ctas);
      } catch (err) {
        console.error('Error cargando sucursales', err);
      }
    };
    load();
  }, []);

  // Si se proporciona initialData (editar), cargarlo en el formulario
  useEffect(() => {
    if (!initialData) return;
    setFormData((prev) => ({
      ...prev,
      cuenta_id: initialData.cuenta_id ?? prev.cuenta_id,
      banco: initialData.cuenta_banco ?? initialData.banco ?? prev.banco,
      numeroCheque: initialData.numero_cheque ?? prev.numeroCheque,
      fechaEmision: initialData.fecha_emision ?? prev.fechaEmision,
      fechaCobro: initialData.fecha_cobro ?? prev.fechaCobro,
      monto: initialData.monto ?? prev.monto,
      origenDestino: initialData.beneficiario ?? prev.origenDestino,
      concepto: initialData.concepto ?? prev.concepto,
      observaciones: initialData.observaciones ?? prev.observaciones,
      sucursal: initialData.id_sucursal ?? prev.sucursal,
      tipo: prev.tipo,
      estado: initialData.estado ?? prev.estado
    }));
  }, [initialData]);

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

    try {
      const payload = {
        cuenta_id: formData.cuenta_id ?? null,
        numero_cheque: formData.numeroCheque,
        fecha_emision: formData.fechaEmision,
        fecha_cobro: formData.fechaCobro || null,
        beneficiario: formData.origenDestino,
        concepto: formData.concepto,
        monto: parseFloat(formData.monto) || 0,
        estado: formData.estado || 'Pendiente',
        observaciones: formData.observaciones || null
      };

      let res;
      if (initialData && initialData.id) {
        res = await updateCheque(initialData.id, payload);
      } else {
        res = await createCheque(payload);
      }

      if (onSave) onSave(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error guardando cheque');
    }
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
                  <label className="form-label">Banco / Cuenta</label>
                  <select
                    className="form-select"
                    value={formData.cuenta_id ?? ''}
                    onChange={(e) => {
                      const cuentaId = e.target.value ? parseInt(e.target.value, 10) : null;
                      setFormData((prev) => {
                        const selected = cuentas.find((c) => c.id === cuentaId);
                        return {
                          ...prev,
                          cuenta_id: cuentaId,
                          banco: selected ? selected.banco : prev.banco,
                          sucursal: selected && selected.id_sucursal ? selected.id_sucursal : prev.sucursal
                        };
                      });
                    }}
                    required
                  >
                    <option value="">Seleccionar cuenta</option>
                    {cuentas.map((ct) => (
                      <option key={ct.id} value={ct.id}>{`${ct.banco} - ${ct.numero_cuenta}`}</option>
                    ))}
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
                  <input
                    type="text"
                    className="form-control"
                    value={
                      (() => {
                        const id = Number(formData.sucursal || formData.sucursal === 0 ? formData.sucursal : NaN);
                        const s = sucursales.find((x) => x.id === id);
                        return s ? s.nombre : '';
                      })()
                    }
                    readOnly
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

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Monto</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cobrado">Cobrado</option>
                    <option value="Rechazado">Rechazado</option>
                    <option value="Prestado">Prestado</option>
                  </select>
                </div>
              </div>

              

              <div className="mb-3">
                <label className="form-label">Destinatario</label>
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