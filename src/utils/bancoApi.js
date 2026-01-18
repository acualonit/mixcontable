import { API_BASE_URL } from './configApi';

async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const defaultHeaders = { Accept: 'application/json' };
  const opts = {
    method,
    credentials: 'include',
    headers: isFormData
      ? { ...defaultHeaders, ...headers }
      : { 'Content-Type': 'application/json', ...defaultHeaders, ...headers },
  };

  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE_URL}${path}`, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) {
    const message = data?.message || 'Error servidor';
    const err = new Error(message);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export const fetchCuentas = () => request('/banco/cuentas');
export const fetchMovimientosBanco = (cuentaId) => request(`/banco/movimientos${cuentaId ? `?cuenta_id=${cuentaId}` : ''}`);

const normalizeMovimientoPayload = (payload = {}) => {
  const p = payload || {};
  const cuentaId = p.cuenta_id ?? p.cuentaId ?? p.cuenta ?? p.id_cuenta ?? p.account_id ?? p.accountId ?? p.cuenta?.id;
  const idSucursal =
    p.id_sucursal ??
    p.sucursal_id ??
    p.sucursalId ??
    p.idSucursal ??
    p.sucursal ??
    p.cuenta?.id_sucursal ??
    p.cuenta?.sucursal_id;

  const montoRaw = p.monto ?? p.valor ?? p.importe ?? p.amount;
  const monto = montoRaw === '' || montoRaw === null || montoRaw === undefined ? undefined : Number(montoRaw);

  return {
    fecha: p.fecha ?? p.date ?? p.fecha_mov ?? p.fechaMovimiento ?? p.created_at,
    tipo: p.tipo ?? p.movement_type ?? p.tipo_movimiento ?? p.tipoMovimiento ?? p.categoria_tipo,
    monto,
    cuenta_id: cuentaId,

    // opcionales
    descripcion: p.descripcion ?? p.detalle ?? p.concepto ?? p.description,
    referencia: p.referencia ?? p.reference,
    categoria: p.categoria ?? p.category,
    observaciones: p.observaciones ?? p.notas ?? p.notes,

    // El backend valida `sucursal` como string; de todos modos mandamos el id por compatibilidad.
    // Si el backend luego se adapta a `id_sucursal`, ya estará disponible.
    id_sucursal: idSucursal,
    sucursal: typeof p.sucursal === 'string' ? p.sucursal : (idSucursal != null ? String(idSucursal) : undefined),
  };
};

export const createMovimientoBanco = (payload) =>
  request('/banco/movimientos', { method: 'POST', body: normalizeMovimientoPayload(payload) });

export const deleteMovimientoBanco = (id) => request(`/banco/movimientos/${id}`, { method: 'DELETE' });
export const updateMovimientoBanco = (id, payload) => request(`/banco/movimientos/${id}`, { method: 'PUT', body: payload });
export const fetchSaldoBanco = (cuentaId) => request(`/banco/saldo${cuentaId ? `?cuenta_id=${cuentaId}` : ''}`);
export const fetchDeletedMovimientosBanco = () => request('/banco/movimientos/eliminados');
export const createCuenta = (payload) => request('/banco/cuentas', { method: 'POST', body: payload });
export const fetchSucursales = () => request('/sucursales');
