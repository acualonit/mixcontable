// En desarrollo usamos el proxy de Vite (`/api`) para evitar problemas CORS.
// En producción se recomienda definir `VITE_API_URL` con la URL completa del API.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const defaultHeaders = {
    Accept: 'application/json',
  };

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

  const response = await fetch(`${API_BASE_URL}${path}`, opts);
  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || 'Error al comunicarse con el servidor';
    const err = new Error(message);
    err.status = response.status;
    err.payload = data;
    throw err;
  }

  return data;
}

export { API_BASE_URL };

export const fetchEmpresas = () => request('/empresas');
export const saveEmpresa = (empresa) => {
  if (empresa?.id) {
    return request(`/empresas/${empresa.id}`, { method: 'PUT', body: empresa });
  }
  return request('/empresas', { method: 'POST', body: empresa });
};

export const fetchSucursales = (empresaId) =>
  request(`/empresas/${empresaId}/sucursales`);

// Endpoint público de sucursales: intenta `/sucursales/public` y si no existe cae a `/sucursales`.
export const fetchPublicSucursales = async () => {
  try {
    return await request('/sucursales/public');
  } catch (err) {
    try {
      return await request('/sucursales');
    } catch (e) {
      throw err;
    }
  }
};

export const saveSucursal = (empresaId, sucursal) => {
  if (sucursal?.id) {
    return request(`/sucursales/${sucursal.id}`, { method: 'PUT', body: sucursal });
  }
  return request(`/empresas/${empresaId}/sucursales`, {
    method: 'POST',
    body: { ...sucursal, empresa_id: empresaId },
  });
};

export const deleteSucursal = (sucursalId) =>
  request(`/sucursales/${sucursalId}`, { method: 'DELETE' });

export const fetchUsuarios = () => request('/usuarios');

export const saveUsuario = (usuario) => {
  if (usuario?.id) {
    return request(`/usuarios/${usuario.id}`, { method: 'PUT', body: usuario });
  }
  return request('/usuarios', { method: 'POST', body: usuario });
};

export const deleteUsuario = (usuarioId) =>
  request(`/usuarios/${usuarioId}`, { method: 'DELETE' });

export const resetUsuarioPassword = (usuarioId, payload = {}) =>
  request(`/usuarios/${usuarioId}/reset-password`, { method: 'POST', body: payload });

// Clientes
export const fetchClientes = () => request('/clientes');

// Buscar cliente por RUT. Intenta varias rutas posibles según el backend.
export const fetchClienteByRut = async (rut) => {
  if (!rut) return null;
  // Normalizar rut (remover espacios)
  const r = String(rut).trim();
  try {
    return await request(`/clientes/rut/${encodeURIComponent(r)}`);
  } catch (err1) {
    try {
      return await request(`/clientes/${encodeURIComponent(r)}`);
    } catch (err2) {
      try {
        const q = new URLSearchParams({ rut: r }).toString();
        const res = await request(`/clientes?${q}`);
        if (Array.isArray(res)) return res[0] ?? null;
        return res;
      } catch (err3) {
        throw err1;
      }
    }
  }
};

export const fetchInactivos = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/clientes/inactivos${query ? `?${query}` : ''}`);
};

export const createCliente = (payload) => request('/clientes', { method: 'POST', body: payload });

export const updateCliente = (clienteId, payload) => request(`/clientes/${clienteId}`, { method: 'PUT', body: payload });

export const inactivateCliente = (clienteId) => request(`/clientes/${clienteId}`, { method: 'DELETE' });

// Buscar clientes por texto (razón social, nombre fantasía o rut)
export const searchClientes = async (q, { limit = 20 } = {}) => {
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (limit) query.set('limit', String(limit));
  return request(`/clientes${query.toString() ? `?${query.toString()}` : ''}`);
};

// Proveedores
export const fetchProveedores = () => request('/proveedores');
export const createProveedor = (payload) => request('/proveedores', { method: 'POST', body: payload });
export const updateProveedor = (proveedorId, payload) => request(`/proveedores/${proveedorId}`, { method: 'PUT', body: payload });
export const inactivateProveedor = (proveedorId) => request(`/proveedores/${proveedorId}`, { method: 'DELETE' });

export const fetchRespaldos = () => request('/respaldos');

export const generarRespaldo = () =>
  request('/respaldos', { method: 'POST' });

export const deleteRespaldo = (respaldoId) =>
  request(`/respaldos/${respaldoId}`, { method: 'DELETE' });

export const restaurarRespaldo = (file) => {
  const formData = new FormData();
  formData.append('archivo', file);

  return request('/respaldos/restaurar', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
};

export const getRespaldoDownloadUrl = (respaldoId) =>
  `${API_BASE_URL}/respaldos/${respaldoId}/descargar`;
