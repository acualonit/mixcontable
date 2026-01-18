import { API_BASE_URL } from './configApi';

// En entorno de desarrollo usamos el endpoint público temporal añadido en el backend
const USE_PUBLIC_VENTAS_IN_DEV = import.meta.env.DEV === true;

async function fetchJson(path, opts = {}) {
  const url = `${API_BASE_URL}${path}`;
  const defaultOpts = { credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };
  const finalOpts = { ...defaultOpts, ...opts };
  if (opts.body && !(opts.body instanceof FormData)) {
    finalOpts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, finalOpts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { data = text; }

  if (res.status === 204) return null;

  if (!res.ok) {
    const err = new Error((data && data.message) ? data.message : `HTTP error ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export const listVentas = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const tryPaths = USE_PUBLIC_VENTAS_IN_DEV ? ['/ventas/public', '/ventas'] : ['/ventas'];
  for (const base of tryPaths) {
    const fullPath = `${base}${query ? `?${query}` : ''}`;
    console.debug('[ventasApi] intentando ->', fullPath);
    try {
      return await fetchJson(fullPath);
    } catch (err) {
      console.warn('[ventasApi] fallo en', fullPath, err.message || err);
    }
  }
  throw new Error('No se pudo obtener la lista de ventas (rutas probadas fallaron).');
};

export const listVentasEliminadas = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJson(`/ventas/eliminadas${query ? `?${query}` : ''}`);
};

export const getVenta = (id) => fetchJson(`/ventas/${id}`);

export const createVenta = (payload) => fetchJson('/ventas', { method: 'POST', body: payload });

export const updateVenta = (id, payload) => fetchJson(`/ventas/${id}`, { method: 'PUT', body: payload });

export const deleteVenta = (id) => fetchJson(`/ventas/${id}`, { method: 'DELETE' });

export const exportVentas = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/ventas/export${query ? `?${query}` : ''}`;

  const resp = await fetch(url, { credentials: 'include' });
  if (!resp.ok) throw new Error('Error al exportar ventas');

  const blob = await resp.blob();

  // Intentar respetar filename del header Content-Disposition
  const cd = resp.headers.get('content-disposition') || '';
  const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || `ventas_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`);

  const link = document.createElement('a');
  const urlBlob = window.URL.createObjectURL(blob);
  link.href = urlBlob;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(urlBlob);
};

export default {
  listVentas,
  getVenta,
  createVenta,
  updateVenta,
  deleteVenta,
  exportVentas,
  listVentasEliminadas,
};
