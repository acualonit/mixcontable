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

export const fetchCheques = (params = {}) => {
  // normalizar filtro de fecha: el backend espera `fecha_cobro`
  const normalized = { ...params };
  if (normalized.fecha && !normalized.fecha_cobro) {
    normalized.fecha_cobro = normalized.fecha;
    delete normalized.fecha;
  }
  const q = new URLSearchParams(normalized).toString();
  return request(`/cheques${q ? `?${q}` : ''}`);
};

export const createCheque = (payload) => request('/cheques', { method: 'POST', body: payload });
export const updateCheque = (id, payload) => request(`/cheques/${id}`, { method: 'PUT', body: payload });

// El backend soporta /cheques/{cheque}/cobrar
export const cobrarCheque = (id, payload = {}) => request(`/cheques/${id}/cobrar`, { method: 'POST', body: payload });

// No siempre existe ruta /anular; se deja como helper que intenta actualizar estado
export const anularCheque = async (id, motivo = '') => {
  try {
    return await request(`/cheques/${id}/anular`, { method: 'POST', body: { motivo } });
  } catch (e) {
    // fallback: actualizar estado (enum real)
    return request(`/cheques/${id}`, { method: 'PUT', body: { estado: 'Rechazado', observaciones: motivo } });
  }
};

export const deleteCheque = (id) => request(`/cheques/${id}`, { method: 'DELETE' });

export default {
  fetchCheques,
  createCheque,
  updateCheque,
  cobrarCheque,
  anularCheque,
  deleteCheque,
};
