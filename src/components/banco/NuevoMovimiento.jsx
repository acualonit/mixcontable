import React, { useState } from 'react';

function NuevoMovimiento({ onClose, onSave, cuentas = [], initialData = null, sucursales = [] }) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'ingreso',
    categoria: '',
    descripcion: '',
    monto: '',
    sucursal: '',
    cuenta: '',
    referencia: '',
    observaciones: ''
  });

  // flag para indicar que la sucursal fue fijada automáticamente desde la cuenta
  const [sucursalReadOnly, setSucursalReadOnly] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      // intentar resolver sucursal como id a partir de sucursales prop
      let sucursalId = initialData.cuenta_sucursal_id ?? initialData.sucursal_id ?? '';

      // si no hay id pero existe nombre en initialData, intentar encontrar id por nombre
      if (!sucursalId && initialData.cuenta_sucursal_nombre) {
        const found = sucursales.find(s => (s.nombre || s.name || s.nombre_sucursal || String(s.id)) === initialData.cuenta_sucursal_nombre || String(s.id) === String(initialData.cuenta_sucursal_nombre));
        if (found) sucursalId = found.id;
      }

      // si initialData tiene cuenta, intentar resolver la sucursal desde la cuenta seleccionada
      let cuentaId = initialData.cuenta_id ?? initialData.cuenta ?? '';
      if (!cuentaId && initialData.cuenta) cuentaId = initialData.cuenta;

      let resolvedSucursal = sucursalId || '';
      let resolvedSucursalName = '';
      if (cuentaId) {
        const selCuenta = cuentas.find(c => String(c.id) === String(cuentaId));
        if (selCuenta) {
          // Preferir id_sucursal si viene en la cuenta, sino el nombre
          resolvedSucursal = selCuenta.id_sucursal ?? selCuenta.cuenta_id_sucursal ?? selCuenta.idSucursal ?? resolvedSucursal;
          resolvedSucursalName = selCuenta.sucursal_nombre ?? selCuenta.nombre ?? selCuenta.sucursal_name ?? '';
        }
      }

      setFormData(prev => ({
        ...prev,
        fecha: initialData.fecha ?? prev.fecha,
        tipo: (initialData.tipo || initialData.tipo_movimiento || prev.tipo),
        categoria: initialData.categoria ?? initialData.descripcion ?? prev.categoria,
        descripcion: initialData.descripcion ?? prev.descripcion,
        monto: initialData.monto ?? initialData.valor ?? initialData.amount ?? prev.monto,
        cuenta: cuentaId ?? prev.cuenta,
        referencia: initialData.referencia ?? prev.referencia,
        observaciones: initialData.observaciones ?? prev.observaciones,
        sucursal: resolvedSucursal || (initialData.sucursal ?? prev.sucursal)
      }));

      // si resolvimos sucursal desde la cuenta o initialData la dejamos como readOnly
      const makeReadOnly = Boolean(resolvedSucursal || (initialData.cuenta_sucursal_nombre));
      setSucursalReadOnly(makeReadOnly);
    }
  }, [initialData, sucursales, cuentas]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nuevo Movimiento Bancario</h5>
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
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
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
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Deposito Bancario">Deposito Bancario</option>
                  <option value="Transbank">Transbank</option>
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
                <label className="form-label">Cuenta</label>
                <select
                  className="form-select"
                  value={formData.cuenta}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setFormData((prev) => ({ ...prev, cuenta: selectedId }));
                    // intentar resolver sucursal desde la cuenta seleccionada
                    const sel = cuentas.find(c => String(c.id) === String(selectedId));
                    if (sel) {
                      const idSucursal = sel.id_sucursal ?? sel.cuenta_id_sucursal ?? sel.idSucursal ?? null;
                      const nombre = sel.sucursal_nombre ?? sel.nombre ?? sel.sucursal_name ?? '';
                      // preferir id de sucursal si está disponible
                      const sucVal = idSucursal ?? nombre ?? '';
                      setFormData((prev) => ({ ...prev, sucursal: sucVal }));
                      setSucursalReadOnly(Boolean(sucVal));
                    } else {
                      // si no se encontró la cuenta, limpiar sucursal y permitir seleccionar manualmente
                      setFormData((prev) => ({ ...prev, sucursal: '' }));
                      setSucursalReadOnly(false);
                    }
                  }}
                  required
                >
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(cuenta => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.banco} - {cuenta.numero_cuenta ?? cuenta.numeroCuenta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Sucursal</label>
                {sucursalReadOnly ? (
                  <input type="text" className="form-control" value={(() => {
                    const id = formData.sucursal;
                    const found = sucursales.find(s => String(s.id) === String(id));
                    return found ? (found.nombre || found.name || found.nombre_sucursal || String(found.id)) : (formData.sucursal || '');
                  })()} readOnly />
                ) : (
                  // Si no está fijada, mostrar select editable, pero DESHABILITADO hasta que se elija una cuenta
                  <select
                    className="form-select"
                    value={formData.sucursal}
                    onChange={(e) => setFormData(prev => ({ ...prev, sucursal: e.target.value }))}
                    required
                    disabled={!formData.cuenta}
                  >
                    <option value="">{formData.cuenta ? 'Seleccionar sucursal' : 'Selecciona una cuenta primero'}</option>
                    {sucursales && sucursales.length > 0 ? (
                      sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre || s.name || `Sucursal ${s.id}`}</option>
                      ))
                    ) : (
                      <option value="">No hay sucursales cargadas</option>
                    )}
                  </select>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Referencia</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.referencia}
                  onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                />
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

export default NuevoMovimiento;