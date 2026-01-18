import { API_BASE_URL } from './configApi';

async function fetchJson(path, opts = {}) {
  const url = `${API_BASE_URL}${path}`;
  const defaultOpts = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  };
  const finalOpts = { ...defaultOpts, ...opts };
  if (opts.body && !(opts.body instanceof FormData)) {
    finalOpts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, finalOpts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP error ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export const listCompras = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJson(`/compras${query ? `?${query}` : ''}`);
};

export const listComprasEliminadas = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJson(`/compras/eliminadas${query ? `?${query}` : ''}`);
};

export const getCompra = (id) => fetchJson(`/compras/${id}`);

export const createCompra = (payload) => fetchJson('/compras', { method: 'POST', body: payload });

export const updateCompra = (id, payload) => fetchJson(`/compras/${id}`, { method: 'PUT', body: payload });

export const deleteCompra = (id) => fetchJson(`/compras/${id}`, { method: 'DELETE' });

export default {
  listCompras,
  listComprasEliminadas,
  getCompra,
  createCompra,
  updateCompra,
  deleteCompra,
};
