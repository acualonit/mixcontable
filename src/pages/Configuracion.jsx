import React, { useState } from 'react';

function Configuracion() {
  const [activeTab, setActiveTab] = useState('general');
  const [configuracion, setConfiguracion] = useState({
    general: {
      nombreEmpresa: 'Mi Empresa SpA',
      rut: '76.123.456-7',
      direccion: 'Av. Principal 123',
      telefono: '+56 2 2345 6789',
      email: 'contacto@miempresa.cl',
      moneda: 'CLP',
      impuesto: 19,
      logo: '',
      sucursales: [
        { id: 1, nombre: 'Central', direccion: 'Av. Principal 123', telefono: '+56 2 2345 6789' },
        { id: 2, nombre: 'Norte', direccion: 'Calle Norte 456', telefono: '+56 2 3456 7890' },
        { id: 3, nombre: 'Sur', direccion: 'Av. Sur 789', telefono: '+56 2 4567 8901' }
      ]
    },
    usuarios: [
      {
        id: 1,
        usuario: 'admin',
        nombre: 'Administrador',
        rol: 'Administrador',
        estado: 'activo',
        email: 'admin@miempresa.cl'
      }
    ],
    respaldo: {
      frecuencia: 'diario',
      hora: '23:00',
      ultimoRespaldo: '2024-01-20 23:00',
      proximoRespaldo: '2024-01-21 23:00',
      rutaRespaldo: '/backups/',
      mantenimientoHistorial: 30 // días
    }
  });

  const handleInputChange = (section, field, value) => {
    setConfiguracion(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSucursalChange = (id, field, value) => {
    setConfiguracion(prev => ({
      ...prev,
      general: {
        ...prev.general,
        sucursales: prev.general.sucursales.map(sucursal =>
          sucursal.id === id ? { ...sucursal, [field]: value } : sucursal
        )
      }
    }));
  };

  const handleNuevaSucursal = () => {
    const nuevaSucursal = {
      id: configuracion.general.sucursales.length + 1,
      nombre: '',
      direccion: '',
      telefono: ''
    };
    setConfiguracion(prev => ({
      ...prev,
      general: {
        ...prev.general,
        sucursales: [...prev.general.sucursales, nuevaSucursal]
      }
    }));
  };

  const handleEliminarSucursal = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta sucursal?')) {
      setConfiguracion(prev => ({
        ...prev,
        general: {
          ...prev.general,
          sucursales: prev.general.sucursales.filter(s => s.id !== id)
        }
      }));
    }
  };

  const handleNuevoUsuario = () => {
    const nuevoUsuario = {
      id: configuracion.usuarios.length + 1,
      usuario: '',
      nombre: '',
      rol: '',
      estado: 'activo',
      email: ''
    };
    setConfiguracion(prev => ({
      ...prev,
      usuarios: [...prev.usuarios, nuevoUsuario]
    }));
  };

  const handleEliminarUsuario = (id) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      setConfiguracion(prev => ({
        ...prev,
        usuarios: prev.usuarios.filter(u => u.id !== id)
      }));
    }
  };

  const handleGenerarRespaldo = () => {
    // Aquí iría la lógica para generar el respaldo
    alert('Generando respaldo...');
  };

  const handleRestaurarRespaldo = () => {
    // Aquí iría la lógica para restaurar el respaldo
    if (window.confirm('¿Está seguro de restaurar el respaldo? Esta acción no se puede deshacer.')) {
      alert('Restaurando respaldo...');
    }
  };

  const handleGuardarCambios = () => {
    // Aquí iría la lógica para guardar los cambios en la base de datos
    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Configuración del Sistema</h2>
        <button 
          className="btn btn-primary"
          onClick={handleGuardarCambios}
        >
          <i className="bi bi-save me-2"></i>
          Guardar Cambios
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'sucursales' ? 'active' : ''}`}
                onClick={() => setActiveTab('sucursales')}
              >
                Sucursales
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`}
                onClick={() => setActiveTab('usuarios')}
              >
                Usuarios
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'respaldo' ? 'active' : ''}`}
                onClick={() => setActiveTab('respaldo')}
              >
                Respaldo
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'general' && (
            <form>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre de la Empresa</label>
                  <input
                    type="text"
                    className="form-control"
                    value={configuracion.general.nombreEmpresa}
                    onChange={(e) => handleInputChange('general', 'nombreEmpresa', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">RUT</label>
                  <input
                    type="text"
                    className="form-control"
                    value={configuracion.general.rut}
                    onChange={(e) => handleInputChange('general', 'rut', e.target.value)}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    className="form-control"
                    value={configuracion.general.direccion}
                    onChange={(e) => handleInputChange('general', 'direccion', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={configuracion.general.telefono}
                    onChange={(e) => handleInputChange('general', 'telefono', e.target.value)}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={configuracion.general.email}
                    onChange={(e) => handleInputChange('general', 'email', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Moneda</label>
                  <select 
                    className="form-select"
                    value={configuracion.general.moneda}
                    onChange={(e) => handleInputChange('general', 'moneda', e.target.value)}
                  >
                    <option value="CLP">Peso Chileno (CLP)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">IVA (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={configuracion.general.impuesto}
                    onChange={(e) => handleInputChange('general', 'impuesto', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Logo de la Empresa</label>
                <input 
                  type="file" 
                  className="form-control" 
                  accept="image/*"
                  onChange={(e) => {
                    // Aquí iría la lógica para manejar la subida del logo
                    console.log('Archivo seleccionado:', e.target.files[0]);
                  }}
                />
              </div>
            </form>
          )}

          {activeTab === 'sucursales' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Sucursales</h5>
                <button 
                  className="btn btn-success"
                  onClick={handleNuevaSucursal}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Sucursal
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Dirección</th>
                      <th>Teléfono</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuracion.general.sucursales.map(sucursal => (
                      <tr key={sucursal.id}>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={sucursal.nombre}
                            onChange={(e) => handleSucursalChange(sucursal.id, 'nombre', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={sucursal.direccion}
                            onChange={(e) => handleSucursalChange(sucursal.id, 'direccion', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={sucursal.telefono}
                            onChange={(e) => handleSucursalChange(sucursal.id, 'telefono', e.target.value)}
                          />
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleEliminarSucursal(sucursal.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Usuarios del Sistema</h5>
                <button 
                  className="btn btn-success"
                  onClick={handleNuevoUsuario}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Usuario
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuracion.usuarios.map(usuario => (
                      <tr key={usuario.id}>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={usuario.usuario}
                            onChange={(e) => {
                              const nuevosUsuarios = configuracion.usuarios.map(u =>
                                u.id === usuario.id ? { ...u, usuario: e.target.value } : u
                              );
                              setConfiguracion(prev => ({
                                ...prev,
                                usuarios: nuevosUsuarios
                              }));
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={usuario.nombre}
                            onChange={(e) => {
                              const nuevosUsuarios = configuracion.usuarios.map(u =>
                                u.id === usuario.id ? { ...u, nombre: e.target.value } : u
                              );
                              setConfiguracion(prev => ({
                                ...prev,
                                usuarios: nuevosUsuarios
                              }));
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            className="form-control"
                            value={usuario.email}
                            onChange={(e) => {
                              const nuevosUsuarios = configuracion.usuarios.map(u =>
                                u.id === usuario.id ? { ...u, email: e.target.value } : u
                              );
                              setConfiguracion(prev => ({
                                ...prev,
                                usuarios: nuevosUsuarios
                              }));
                            }}
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={usuario.rol}
                            onChange={(e) => {
                              const nuevosUsuarios = configuracion.usuarios.map(u =>
                                u.id === usuario.id ? { ...u, rol: e.target.value } : u
                              );
                              setConfiguracion(prev => ({
                                ...prev,
                                usuarios: nuevosUsuarios
                              }));
                            }}
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Usuario">Usuario</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={usuario.estado}
                            onChange={(e) => {
                              const nuevosUsuarios = configuracion.usuarios.map(u =>
                                u.id === usuario.id ? { ...u, estado: e.target.value } : u
                              );
                              setConfiguracion(prev => ({
                                ...prev,
                                usuarios: nuevosUsuarios
                              }));
                            }}
                          >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                          </select>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => {
                                // Aquí iría la lógica para resetear la contraseña
                                alert('Funcionalidad de reseteo de contraseña en desarrollo');
                              }}
                              title="Resetear contraseña"
                            >
                              <i className="bi bi-key"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleEliminarUsuario(usuario.id)}
                              title="Eliminar usuario"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'respaldo' && (
            <div>
              <h5 className="mb-4">Respaldo de Datos</h5>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title">Respaldo Manual</h6>
                      <p className="card-text">Genera un respaldo completo de la base de datos.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={handleGenerarRespaldo}
                      >
                        <i className="bi bi-download me-2"></i>
                        Generar Respaldo
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title">Respaldo Automático</h6>
                      <div className="mb-3">
                        <label className="form-label">Frecuencia</label>
                        <select 
                          className="form-select"
                          value={configuracion.respaldo.frecuencia}
                          onChange={(e) => handleInputChange('respaldo', 'frecuencia', e.target.value)}
                        >
                          <option value="diario">Diario</option>
                          <option value="semanal">Semanal</option>
                          <option value="mensual">Mensual</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Hora del Respaldo</label>
                        <input
                          type="time"
                          className="form-control"
                          value={configuracion.respaldo.hora}
                          onChange={(e) => handleInputChange('respaldo', 'hora', e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Mantener Historial (días)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={configuracion.respaldo.mantenimientoHistorial}
                          onChange={(e) => handleInputChange('respaldo', 'mantenimientoHistorial', parseInt(e.target.value))}
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mt-4">
                <div className="card-body">
                  <h6 className="card-title">Restaurar Respaldo</h6>
                  <p className="card-text">Selecciona un archivo de respaldo para restaurar la base de datos.</p>
                  <div className="mb-3">
                    <input 
                      type="file" 
                      className="form-control" 
                      accept=".sql,.dump"
                      onChange={(e) => {
                        // Aquí iría la lógica para manejar el archivo de respaldo
                        console.log('Archivo seleccionado:', e.target.files[0]);
                      }}
                    />
                  </div>
                  <button 
                    className="btn btn-warning"
                    onClick={handleRestaurarRespaldo}
                  >
                    <i className="bi bi-upload me-2"></i>
                    Restaurar Respaldo
                  </button>
                </div>
              </div>

              <div className="alert alert-info mt-4">
                <h6 className="alert-heading">Información de Respaldos</h6>
                <p className="mb-0">
                  <strong>Último respaldo:</strong> {configuracion.respaldo.ultimoRespaldo}<br />
                  <strong>Próximo respaldo:</strong> {configuracion.respaldo.proximoRespaldo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Configuracion;