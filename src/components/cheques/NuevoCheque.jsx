import React, { useState, useEffect, useMemo } from 'react';
import { registrarMovimientoEfectivo } from '../../utils/efectivoUtils';
import { fetchEmpresas, fetchSucursales as fetchSucursalesEmpresa } from '../../utils/configApi';
import { fetchCuentas } from '../../utils/bancoApi';

function NuevoCheque({ onClose, onSave, initialData = null }) {
  const [cuentas, setCuentas] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [formData, setFormData] = useState({
    tipo: 'emitido',
    cuenta_id: '',
    numeroCheque: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaCobro: '',
    monto: '',
    origenDestino: '',
    sucursal: '',
    concepto: '',
    incluirFlujoCaja: true,
    observaciones: '',
    estado: 'Pendiente',
  });

  // Cargar cuentas bancarias reales (Banco -> cuentas)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchCuentas();
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        if (!mounted) return;
        setCuentas(list || []);
      } catch (e) {
        if (!mounted) return;
        console.warn('No se pudieron cargar cuentas bancarias:', e?.message || e);
        setCuentas([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar sucursales reales (empresa actual -> sucursales)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const empresasRes = await fetchEmpresas();
        const empresa = Array.isArray(empresasRes) ? empresasRes[0] : (empresasRes?.data ? empresasRes.data[0] : null);
        if (!empresa) {
          if (mounted) setSucursales([]);
          return;
        }
        const sucRes = await fetchSucursalesEmpresa(empresa.id);
        const list = Array.isArray(sucRes) ? sucRes : (sucRes?.data ?? []);
        if (!mounted) return;
        setSucursales(list || []);
      } catch (e) {
        if (!mounted) return;
        console.warn('No se pudieron cargar sucursales:', e?.message || e);
        setSucursales([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const cuentasOptions = useMemo(() => {
    return (cuentas || []).map(c => {
      const label = [c.banco, c.numero_cuenta || c.numeroCuenta].filter(Boolean).join(' - ');
      return {
        id: c.id,
        label: label || `Cuenta #${c.id}`,
        id_sucursal: c.id_sucursal ?? c.sucursal_id ?? c.idSucursal ?? null,
      };
    });
  }, [cuentas]);

  // Cuando cambia la cuenta, tomar sucursal automáticamente y dejarla solo lectura
  useEffect(() => {
    const selected = cuentasOptions.find(x => String(x.id) === String(formData.cuenta_id));
    if (!selected) return;
    const sid = selected.id_sucursal;
    if (sid != null && String(sid) !== String(formData.sucursal || '')) {
      setFormData(prev => ({ ...prev, sucursal: String(sid) }));
    }
  }, [formData.cuenta_id, cuentasOptions]);

  const sucursalLabel = useMemo(() => {
    if (!formData.sucursal) return '';
    const s = (sucursales || []).find(x => String(x.id ?? x.value ?? x.name) === String(formData.sucursal));
    return s ? (s.nombre ?? s.name ?? s.label ?? s.sucursal_nombre ?? String(s)) : String(formData.sucursal);
  }, [formData.sucursal, sucursales]);

  const isEdit = Boolean(initialData?.id);

  // Detectar si el cheque proviene de CxC (observaciones o raw) para limitar edición
  const isFromCxc = React.useMemo(() => {
    try {
      const obs = (initialData?.observaciones || initialData?.raw?.observaciones || initialData?.raw?.observacion || '');
      const low = (obs || '').toString().toLowerCase();
      if (!low) return false;
      return low.includes('cxc') || low.includes('origen:cxc') || low.includes('pago cxc') || low.includes('creado automaticamente') || low.includes('creado automáticamente');
    } catch (e) { return false; }
  }, [initialData]);

  useEffect(() => {
    if (!initialData) return;
    setFormData((f) => ({
      ...f,
      tipo: initialData.tipo || f.tipo,
      cuenta_id: String(initialData.cuenta_id ?? initialData.cuentaId ?? initialData.cuenta?.id ?? f.cuenta_id ?? ''),
      numeroCheque: initialData.numeroCheque || initialData.numero_cheque || f.numeroCheque,
      fechaEmision: initialData.fechaEmision || initialData.fecha_emision || f.fechaEmision,
      fechaCobro: initialData.fechaCobro || initialData.fecha_cobro || f.fechaCobro,
      monto: (initialData.monto !== undefined && initialData.monto !== null) ? initialData.monto : f.monto,
      origenDestino: initialData.origenDestino || initialData.beneficiario || f.origenDestino,
      sucursal: String(initialData.sucursal || initialData.id_sucursal || f.sucursal || ''),
      concepto: initialData.concepto || f.concepto,
      observaciones: initialData.observaciones || f.observaciones,
      estado: String(initialData.estado || f.estado || 'Pendiente'),
      id: initialData.id || null,
    }));
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación mínima: cuenta_id es requerida en DB (solo si no es edición limitada por CxC)
    if (!formData.cuenta_id && !isFromCxc) {
      alert('Debes seleccionar un banco/cuenta.');
      return;
    }

    if (formData.incluirFlujoCaja && formData.tipo === 'emitido' && !isFromCxc) {
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

    // Si el cheque proviene de CxC, solo enviar los campos permitidos (fecha_cobro, estado, user_id si aplica, y id)
    const toSend = isFromCxc ? {
      id: formData.id || null,
      fecha_cobro: formData.fechaCobro || null,
      estado: formData.estado || null,
      user_id: formData.user_id || null,
    } : formData;

    onSave(toSend);
    onClose();
  };

  return (
    <div
      className="modal fade show"
      role="dialog"
      aria-modal="true"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">{isEdit ? 'Editar Cheque' : 'Nuevo Cheque'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Tipo de Cheque</label>
                  <select
                    className="form-select"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                    disabled={isFromCxc}
                  >
                    <option value="emitido">Emitido</option>
                    <option value="recibido">Recibido</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Banco / Cuenta</label>
                  <select
                    className="form-select"
                    value={formData.cuenta_id}
                    onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })}
                    required
                    disabled={isFromCxc}
                  >
                    <option value="">Seleccionar banco</option>
                    {cuentasOptions.map(opt => (
                      <option key={opt.id} value={String(opt.id)}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Número de Cheque</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numeroCheque}
                    onChange={(e) => setFormData({ ...formData, numeroCheque: e.target.value })}
                    required
                    disabled={isFromCxc}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Sucursal</label>
                  <input
                    className="form-control"
                    value={sucursalLabel}
                    readOnly
                    placeholder="Se asigna automáticamente por el banco/cuenta"
                  />
                  <div className="form-text">La sucursal se obtiene desde la cuenta bancaria seleccionada.</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Fecha de Emisión</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaEmision}
                    onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                    required
                    disabled={isFromCxc}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Fecha de Cobro</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaCobro}
                    onChange={(e) => setFormData({ ...formData, fechaCobro: e.target.value })}
                    placeholder="Opcional"
                    required={false}
                  />
                  <div className="form-text">Opcional (si aún no se cobra, puede quedar vacío).</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Monto</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    required
                    min={0}
                    step="0.01"
                    disabled={isFromCxc}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">{formData.tipo === 'emitido' ? 'Destinatario' : 'Origen'}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.origenDestino}
                    onChange={(e) => setFormData({ ...formData, origenDestino: e.target.value })}
                    required
                    disabled={isFromCxc}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cobrado">Cobrado</option>
                    <option value="Rechazado">Rechazado</option>
                    <option value="Prestado">Prestado</option>
                  </select>
                </div>

                <div className="col-md-12">
                  <label className="form-label">Concepto</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    required
                    disabled={isFromCxc}
                  />
                </div>

                <div className="col-md-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="incluirFlujoCaja"
                      checked={formData.incluirFlujoCaja}
                      onChange={(e) => setFormData({ ...formData, incluirFlujoCaja: e.target.checked })}
                      disabled={isFromCxc}
                    />
                    <label className="form-check-label" htmlFor="incluirFlujoCaja">
                      Incluir en el Flujo de Caja
                    </label>
                  </div>
                </div>

                <div className="col-md-12">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={3}
                    disabled={isFromCxc}
                  />
                </div>

                {isFromCxc && (
                  <div className="col-12">
                    <div className="alert alert-warning small">Este cheque está vinculado a un pago de CxC; la edición está limitada en este formulario. Solo se puede modificar la fecha de cobro y el estado.</div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ position: 'sticky', bottom: 0, background: '#fff', zIndex: 1 }}>
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