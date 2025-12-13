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

  if (body) {
    opts.body = isFormData ? body : JSON.stringify(body);
  }

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

export const fetchSaldo = () => request('/efectivo/saldo');
export const fetchMovimientos = () => request('/efectivo/movimientos');
export const createMovimiento = (payload) => request('/efectivo', { method: 'POST', body: payload });
export const updateMovimiento = (id, payload) => request(`/efectivo/${id}`, { method: 'PUT', body: payload });
export const deleteMovimiento = (id) => request(`/efectivo/${id}`, { method: 'DELETE' });
export const fetchDeletedMovimientos = () => request('/efectivo/eliminados');
export const fetchUsuarios = () => request('/usuarios');
