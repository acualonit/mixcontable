const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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

export const fetchInactivos = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/clientes/inactivos${query ? `?${query}` : ''}`);
};

export const createCliente = (payload) => request('/clientes', { method: 'POST', body: payload });

export const updateCliente = (clienteId, payload) => request(`/clientes/${clienteId}`, { method: 'PUT', body: payload });

export const inactivateCliente = (clienteId) => request(`/clientes/${clienteId}`, { method: 'DELETE' });

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
