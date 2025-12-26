import { API_BASE_URL } from './configApi';

// If request helper not present, implement a lightweight wrapper here
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

export const fetchCheques = (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(k => { if (filters[k]) params.append(k, filters[k]); });
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/cheques${qs}`);
};

export const createCheque = (payload) => request('/cheques', { method: 'POST', body: payload });
export const updateCheque = (id, payload) => request(`/cheques/${id}`, { method: 'PUT', body: payload });
export const deleteCheque = (id) => request(`/cheques/${id}`, { method: 'DELETE' });
export const cobrarCheque = (id, payload = {}) => request(`/cheques/${id}/cobrar`, { method: 'POST', body: payload });
export const fetchCheque = (id) => request(`/cheques/${id}`);
export const restoreCheque = (id) => request(`/cheques/${id}/restore`, { method: 'POST' });
