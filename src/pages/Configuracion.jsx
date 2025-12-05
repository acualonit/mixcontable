import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchEmpresas,
  saveEmpresa,
  fetchSucursales,
  saveSucursal,
  deleteSucursal,
  fetchUsuarios,
  saveUsuario,
  deleteUsuario,
  resetUsuarioPassword,
  fetchRespaldos,
  generarRespaldo,
  deleteRespaldo,
  restaurarRespaldo,
  getRespaldoDownloadUrl,
} from '../utils/configApi';

const ROLE_OPTIONS = [
  { value: 'ADMINISTRADOR', label: 'ADMINISTRADOR' },
  { value: 'VENDEDOR', label: 'VENDEDOR' },
  { value: 'SUPERVISOR', label: 'SUPERVISOR' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const MONEDA_OPTIONS = [
  { value: 'CLP', label: 'Peso Chileno (CLP)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const generateTempId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const emptyEmpresa = {
  id: null,
  nombre: '',
  rut: '',
  direccion: '',
  telefono: '',
  email: '',
  moneda: 'CLP',
  iva: 19,
};

const normalizeSucursal = (sucursal = {}) => ({
  id: sucursal.id ?? null,
  localId: sucursal.localId ?? generateTempId(),
  nombre: sucursal.nombre ?? '',
  direccion: sucursal.direccion ?? '',
  telefono: sucursal.telefono ?? '',
});

const normalizeUsuario = (usuario = {}) => ({
  id: usuario.id ?? null,
  localId: usuario.localId ?? generateTempId(),
  username: usuario.username ?? '',
  name: usuario.name ?? '',
  email: usuario.email ?? '',
  role: usuario.role ?? 'SUPERVISOR',
  status: usuario.status ?? 'ACTIVO',
});

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

function Configuracion() {
  const [activeTab, setActiveTab] = useState('general');
  const [empresaForm, setEmpresaForm] = useState(emptyEmpresa);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [respaldos, setRespaldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState({ empresa: false, sucursal: null, usuario: null, respaldo: false });
  const [archivoRestauracion, setArchivoRestauracion] = useState(null);

  const ultimoRespaldo = useMemo(() => (respaldos.length ? respaldos[0] : null), [respaldos]);

  useEffect(() => {
    cargarTodo();
  }, []);

  const mostrarFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  const limpiarFeedback = () => setFeedback(null);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [empresasResponse, usuariosResponse, respaldosResponse] = await Promise.all([
        fetchEmpresas(),
        fetchUsuarios(),
        fetchRespaldos(),
      ]);

      const empresaPrincipal = empresasResponse?.[0] ?? null;
      if (empresaPrincipal) {
        setEmpresaSeleccionada(empresaPrincipal);
        setEmpresaForm({
          id: empresaPrincipal.id,
          nombre: empresaPrincipal.nombre ?? '',
          rut: empresaPrincipal.rut ?? '',
          direccion: empresaPrincipal.direccion ?? '',
          telefono: empresaPrincipal.telefono ?? '',
          email: empresaPrincipal.email ?? '',
          moneda: empresaPrincipal.moneda ?? 'CLP',
          iva: empresaPrincipal.iva ?? 19,
        });

        const sucursalesResponse = await fetchSucursales(empresaPrincipal.id);
        setSucursales(sucursalesResponse.map(normalizeSucursal));
      } else {
        setEmpresaSeleccionada(null);
        setEmpresaForm(emptyEmpresa);
        setSucursales([]);
      }

      setUsuarios(usuariosResponse.map(normalizeUsuario));
      setRespaldos(respaldosResponse);
    } catch (error) {
      mostrarFeedback('danger', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaChange = (field, value) => {
    setEmpresaForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardarEmpresa = async (event) => {
    event?.preventDefault();
    setSaving((prev) => ({ ...prev, empresa: true }));
    try {
      const response = await saveEmpresa(empresaForm);
      const empresaActualizada = response.empresa ?? response;
      setEmpresaSeleccionada(empresaActualizada);
      setEmpresaForm({
        id: empresaActualizada.id,
        nombre: empresaActualizada.nombre ?? '',
        rut: empresaActualizada.rut ?? '',
        direccion: empresaActualizada.direccion ?? '',
        telefono: empresaActualizada.telefono ?? '',
        email: empresaActualizada.email ?? '',
        moneda: empresaActualizada.moneda ?? 'CLP',
        iva: empresaActualizada.iva ?? 19,
      });
      mostrarFeedback('success', response.message ?? 'Empresa guardada');
    } catch (error) {
      mostrarFeedback('danger', error.message);
    } finally {
      setSaving((prev) => ({ ...prev, empresa: false }));
    }
  };

  const handleNuevaSucursal = () => {
    setSucursales((prev) => [...prev, normalizeSucursal({})]);
  };

  const handleSucursalField = (localId, field, value) => {
    setSucursales((prev) => prev.map((sucursal) => (sucursal.localId === localId ? { ...sucursal, [field]: value } : sucursal)));
  };

  const handleGuardarSucursal = async (sucursal) => {
    if (!empresaSeleccionada?.id) {
      mostrarFeedback('warning', 'Primero guarda los datos de la empresa');
      return;
    }

    setSaving((prev) => ({ ...prev, sucursal: sucursal.localId }));
    try {
      const response = await saveSucursal(empresaSeleccionada.id, sucursal);
      const sucursalActualizada = normalizeSucursal(response.sucursal ?? response);
      setSucursales((prev) => prev.map((item) => (item.localId === sucursal.localId ? { ...sucursalActualizada, localId: sucursal.localId } : item)));
      mostrarFeedback('success', response.message ?? 'Sucursal guardada');
    } catch (error) {
      mostrarFeedback('danger', error.message);
    } finally {
      setSaving((prev) => ({ ...prev, sucursal: null }));
    }
  };

  const handleEliminarSucursal = async (sucursal) => {
    if (!window.confirm('¿Eliminar esta sucursal?')) {
      return;
    }

    try {
      if (sucursal.id) {
        await deleteSucursal(sucursal.id);
      }
      setSucursales((prev) => prev.filter((item) => item.localId !== sucursal.localId));
      mostrarFeedback('success', 'Sucursal eliminada');
    } catch (error) {
      mostrarFeedback('danger', error.message);
    }
  };

  const handleNuevoUsuario = () => {
    setUsuarios((prev) => [...prev, normalizeUsuario({})]);
  };

  const handleUsuarioField = (localId, field, value) => {
    setUsuarios((prev) => prev.map((usuario) => (usuario.localId === localId ? { ...usuario, [field]: value } : usuario)));
  };

  const handleGuardarUsuario = async (usuario) => {
    setSaving((prev) => ({ ...prev, usuario: usuario.localId }));
    try {
      const response = await saveUsuario(usuario);
      const usuarioActualizado = normalizeUsuario(response.user ?? response);
      setUsuarios((prev) => prev.map((item) => (item.localId === usuario.localId ? { ...usuarioActualizado, localId: usuario.localId } : item)));
      if (response.temporary_password) {
        mostrarFeedback('info', `Contraseña temporal: ${response.temporary_password}`);
      } else {
        mostrarFeedback('success', response.message ?? 'Usuario actualizado');
      }
    } catch (error) {
      mostrarFeedback('danger', error.message);
    } finally {
      setSaving((prev) => ({ ...prev, usuario: null }));
    }
  };

  const handleEliminarUsuario = async (usuario) => {
    if (!window.confirm('¿Eliminar este usuario?')) {
      return;
    }

    try {
      if (usuario.id) {
        await deleteUsuario(usuario.id);
      }
      setUsuarios((prev) => prev.filter((item) => item.localId !== usuario.localId));
      mostrarFeedback('success', 'Usuario eliminado');
    } catch (error) {
      mostrarFeedback('danger', error.message);
    }
  };

  const handleResetPassword = async (usuario) => {
    setSaving((prev) => ({ ...prev, usuario: usuario.localId }));
    try {
      const response = await resetUsuarioPassword(usuario.id);
      if (response.temporary_password) {
        mostrarFeedback('info', `Nueva contraseña: ${response.temporary_password}`);
      } else {
        mostrarFeedback('success', response.message ?? 'Contraseña actualizada');
      }
    } catch (error) {
      mostrarFeedback('danger', error.message);
    } finally {
      setSaving((prev) => ({ ...prev, usuario: null }));
    }
  };

  const handleGenerarRespaldo = async () => {
    setSaving((prev) => ({ ...prev, respaldo: true }));
    try {
      const response = await generarRespaldo();
      if (response.respaldo) {
        setRespaldos((prev) => [response.respaldo, ...prev]);
      }
      mostrarFeedback('success', response.message ?? 'Respaldo generado');
    } catch (error) {
      mostrarFeedback('danger', error.message);
    } finally {
      setSaving((prev) => ({ ...prev, respaldo: false }));
    }
  };

  const handleEliminarRespaldo = async (respaldo) => {
    if (!window.confirm('¿Eliminar este respaldo?')) {
      return;
    }

    try {
      await deleteRespaldo(respaldo.id);
      setRespaldos((prev) => prev.filter((item) => item.id !== respaldo.id));
      mostrarFeedback('success', 'Respaldo eliminado');
    } catch (error) {
      mostrarFeedback('danger', error.message);
    }
  };

  const handleRestaurarRespaldo = async () => {
    if (!archivoRestauracion) {
      mostrarFeedback('warning', 'Selecciona un archivo .sql o .dump');
      return;
    }

    setSaving((prev) => ({ ...prev, respaldo: true }));
    try {
      const response = await restaurarRespaldo(archivoRestauracion);
      mostrarFeedback('info', response.message ?? 'Archivo enviado. Ejecuta la restauración desde el servidor.');
      setArchivoRestauracion(null);
    } catch (error) {
      mostrarFeedback('danger', error.message);
    } finally {
      setSaving((prev) => ({ ...prev, respaldo: false }));
    }
  };

  const renderLoading = () => (
    <div className="alert alert-info">Cargando configuración...</div>
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Configuración del Sistema</h2>
        <button type="button" className="btn btn-primary" onClick={handleGuardarEmpresa} disabled={saving.empresa || loading}>
          <i className="bi bi-save me-2" />
          {saving.empresa ? 'Guardando...' : 'Guardar Empresa'}
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show`} role="alert">
          {feedback.message}
          <button type="button" className="btn-close" onClick={limpiarFeedback} aria-label="Cerrar" />
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                General
              </button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'sucursales' ? 'active' : ''}`} onClick={() => setActiveTab('sucursales')}>
                Sucursales
              </button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>
                Usuarios
              </button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'respaldo' ? 'active' : ''}`} onClick={() => setActiveTab('respaldo')}>
                Respaldos
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {loading && renderLoading()}

          {!loading && activeTab === 'general' && (
            <form onSubmit={handleGuardarEmpresa}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre de la Empresa</label>
                  <input type="text" className="form-control" value={empresaForm.nombre} onChange={(event) => handleEmpresaChange('nombre', event.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">RUT</label>
                  <input type="text" className="form-control" value={empresaForm.rut} onChange={(event) => handleEmpresaChange('rut', event.target.value)} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Dirección</label>
                  <input type="text" className="form-control" value={empresaForm.direccion} onChange={(event) => handleEmpresaChange('direccion', event.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono</label>
                  <input type="text" className="form-control" value={empresaForm.telefono} onChange={(event) => handleEmpresaChange('telefono', event.target.value)} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={empresaForm.email} onChange={(event) => handleEmpresaChange('email', event.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Moneda</label>
                  <select className="form-select" value={empresaForm.moneda} onChange={(event) => handleEmpresaChange('moneda', event.target.value)}>
                    {MONEDA_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">IVA (%)</label>
                  <input type="number" className="form-control" min="0" max="100" value={empresaForm.iva} onChange={(event) => handleEmpresaChange('iva', Number(event.target.value))} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving.empresa}>
                {saving.empresa ? 'Guardando...' : 'Guardar datos generales'}
              </button>
            </form>
          )}

          {!loading && activeTab === 'sucursales' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Sucursales</h5>
                <button type="button" className="btn btn-success" onClick={handleNuevaSucursal}>
                  <i className="bi bi-plus-circle me-2" />Nueva Sucursal
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Dirección</th>
                      <th>Teléfono</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sucursales.map((sucursal) => (
                      <tr key={sucursal.localId}>
                        <td>
                          <input type="text" className="form-control" value={sucursal.nombre} onChange={(event) => handleSucursalField(sucursal.localId, 'nombre', event.target.value)} />
                        </td>
                        <td>
                          <input type="text" className="form-control" value={sucursal.direccion} onChange={(event) => handleSucursalField(sucursal.localId, 'direccion', event.target.value)} />
                        </td>
                        <td>
                          <input type="text" className="form-control" value={sucursal.telefono} onChange={(event) => handleSucursalField(sucursal.localId, 'telefono', event.target.value)} />
                        </td>
                        <td className="text-end">
                          <div className="btn-group">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleGuardarSucursal(sucursal)} disabled={saving.sucursal === sucursal.localId}>
                              {saving.sucursal === sucursal.localId ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleEliminarSucursal(sucursal)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!sucursales.length && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No hay sucursales registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === 'usuarios' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Usuarios del Sistema</h5>
                <button type="button" className="btn btn-success" onClick={handleNuevoUsuario}>
                  <i className="bi bi-plus-circle me-2" />Nuevo Usuario
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.localId}>
                        <td>
                          <input type="text" className="form-control" value={usuario.username} onChange={(event) => handleUsuarioField(usuario.localId, 'username', event.target.value)} />
                        </td>
                        <td>
                          <input type="text" className="form-control" value={usuario.name} onChange={(event) => handleUsuarioField(usuario.localId, 'name', event.target.value)} />
                        </td>
                        <td>
                          <input type="email" className="form-control" value={usuario.email} onChange={(event) => handleUsuarioField(usuario.localId, 'email', event.target.value)} />
                        </td>
                        <td>
                          <select className="form-select" value={usuario.role} onChange={(event) => handleUsuarioField(usuario.localId, 'role', event.target.value)}>
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select className="form-select" value={usuario.status} onChange={(event) => handleUsuarioField(usuario.localId, 'status', event.target.value)}>
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="text-end">
                          <div className="btn-group">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleGuardarUsuario(usuario)} disabled={saving.usuario === usuario.localId}>
                              {saving.usuario === usuario.localId ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleResetPassword(usuario)} disabled={!usuario.id || saving.usuario === usuario.localId}>
                              <i className="bi bi-key" />
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleEliminarUsuario(usuario)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!usuarios.length && (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === 'respaldo' && (
            <div>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">Respaldo manual</h5>
                      <p className="card-text">Genera un archivo .sql descargable con toda la base de datos.</p>
                      <button type="button" className="btn btn-primary" onClick={handleGenerarRespaldo} disabled={saving.respaldo}>
                        {saving.respaldo ? 'Generando...' : 'Generar respaldo'}
                      </button>
                      {ultimoRespaldo && (
                        <p className="text-muted mt-3 mb-0">
                          Último respaldo: {formatDateTime(ultimoRespaldo.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">Restaurar respaldo</h5>
                      <p className="card-text">Carga un archivo .sql o .dump para almacenarlo en el servidor y restaurarlo manualmente.</p>
                      <input type="file" className="form-control mb-3" accept=".sql,.dump" onChange={(event) => setArchivoRestauracion(event.target.files?.[0] ?? null)} />
                      <button type="button" className="btn btn-warning" onClick={handleRestaurarRespaldo} disabled={saving.respaldo}>
                        Enviar archivo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mt-4">
                <div className="card-body">
                  <h5 className="card-title">Historial de respaldos</h5>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Usuario</th>
                          <th>Archivo</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {respaldos.map((respaldo) => (
                          <tr key={respaldo.id}>
                            <td>{formatDateTime(respaldo.created_at)}</td>
                            <td className="text-uppercase small">{respaldo.tipo}</td>
                            <td>
                              <span className={`badge bg-${respaldo.estado === 'COMPLETADO' ? 'success' : respaldo.estado === 'PENDIENTE' ? 'warning' : 'danger'}`}>
                                {respaldo.estado}
                              </span>
                            </td>
                            <td>{respaldo.usuario?.name ?? '—'}</td>
                            <td>{respaldo.archivo ?? '—'}</td>
                            <td className="text-end">
                              <div className="btn-group">
                                {respaldo.ruta && (
                                  <a className="btn btn-sm btn-outline-primary" href={getRespaldoDownloadUrl(respaldo.id)} target="_blank" rel="noreferrer">
                                    <i className="bi bi-download" />
                                  </a>
                                )}
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleEliminarRespaldo(respaldo)}>
                                  <i className="bi bi-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!respaldos.length && (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">
                              Aún no se generan respaldos.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Configuracion;