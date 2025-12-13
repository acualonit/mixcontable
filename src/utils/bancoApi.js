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
export const createMovimientoBanco = (payload) => request('/banco/movimientos', { method: 'POST', body: payload });
export const deleteMovimientoBanco = (id) => request(`/banco/movimientos/${id}`, { method: 'DELETE' });
export const updateMovimientoBanco = (id, payload) => request(`/banco/movimientos/${id}`, { method: 'PUT', body: payload });
export const fetchSaldoBanco = (cuentaId) => request(`/banco/saldo${cuentaId ? `?cuenta_id=${cuentaId}` : ''}`);
export const fetchDeletedMovimientosBanco = () => request('/banco/movimientos/eliminados');
export const createCuenta = (payload) => request('/banco/cuentas', { method: 'POST', body: payload });
export const fetchSucursales = () => request('/sucursales');
