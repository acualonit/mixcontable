import React, { useState } from 'react';

function Personaliza() {
  const [activeTab, setActiveTab] = useState('general');
  const [configuracion, setConfiguracion] = useState({
    general: {
      colorPrimario: '#9900ff',
      colorSecundario: '#b84dff',
      colorFondo: '#ffffff',
      fuente: 'Arial',
      tamanoFuente: '14px'
    },
    tablas: {
      filasVisibles: 10,
      colorEncabezado: '#f8f9fa',
      colorFilasPares: '#ffffff',
      colorFilasImpares: '#f9f9f9',
      colorHover: '#f5f5f5'
    },
    modulos: {
      ventas: true,
      compras: true,
      gastos: true,
      clientes: true,
      proveedores: true,
      personal: true,
      nomina: true,
      banco: true,
      cheques: true,
      activos: true,
      servicios: true,
      recurrente: true,
      otrosIngresos: true,
      otrosEgresos: true,
      informes: true
    },
    notificaciones: {
      ventasNuevas: true,
      comprasNuevas: true,
      pagosVencidos: true,
      cobrosVencidos: true,
      stockBajo: true,
      serviciosVencidos: true,
      cumpleanosPersonal: true,
      vencimientoContratos: true
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

  const handleGuardarCambios = () => {
    // Aquí iría la lógica para guardar los cambios en la base de datos
    alert('Configuración guardada exitosamente');
  };

  const handleRestablecerDefecto = () => {
    if (window.confirm('¿Está seguro de restablecer la configuración por defecto? Se perderán todos los cambios.')) {
      // Aquí iría la lógica para restablecer la configuración por defecto
      alert('Configuración restablecida a valores por defecto');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Personalización del Sistema</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-warning"
            onClick={handleRestablecerDefecto}
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>
            Restablecer Defecto
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleGuardarCambios}
          >
            <i className="bi bi-save me-2"></i>
            Guardar Cambios
          </button>
        </div>
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
                className={`nav-link ${activeTab === 'tablas' ? 'active' : ''}`}
                onClick={() => setActiveTab('tablas')}
              >
                Tablas
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'modulos' ? 'active' : ''}`}
                onClick={() => setActiveTab('modulos')}
              >
                Módulos
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'notificaciones' ? 'active' : ''}`}
                onClick={() => setActiveTab('notificaciones')}
              >
                Notificaciones
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'general' && (
            <div>
              <h5 className="mb-4">Apariencia General</h5>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Color Primario</label>
                  <div className="input-group">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={configuracion.general.colorPrimario}
                      onChange={(e) => handleInputChange('general', 'colorPrimario', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={configuracion.general.colorPrimario}
                      onChange={(e) => handleInputChange('general', 'colorPrimario', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Color Secundario</label>
                  <div className="input-group">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={configuracion.general.colorSecundario}
                      onChange={(e) => handleInputChange('general', 'colorSecundario', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={configuracion.general.colorSecundario}
                      onChange={(e) => handleInputChange('general', 'colorSecundario', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Color de Fondo</label>
                  <div className="input-group">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={configuracion.general.colorFondo}
                      onChange={(e) => handleInputChange('general', 'colorFondo', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={configuracion.general.colorFondo}
                      onChange={(e) => handleInputChange('general', 'colorFondo', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fuente</label>
                  <select
                    className="form-select"
                    value={configuracion.general.fuente}
                    onChange={(e) => handleInputChange('general', 'fuente', e.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Tamaño de Fuente</label>
                <select
                  className="form-select"
                  value={configuracion.general.tamanoFuente}
                  onChange={(e) => handleInputChange('general', 'tamanoFuente', e.target.value)}
                >
                  <option value="12px">12px</option>
                  <option value="14px">14px</option>
                  <option value="16px">16px</option>
                  <option value="18px">18px</option>
                </select>
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Los cambios en la apariencia se aplicarán después de reiniciar la aplicación.
              </div>
            </div>
          )}

          {activeTab === 'tablas' && (
            <div>
              <h5 className="mb-4">Configuración de Tablas</h5>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Filas Visibles por Defecto</label>
                  <select
                    className="form-select"
                    value={configuracion.tablas.filasVisibles}
                    onChange={(e) => handleInputChange('tablas', 'filasVisibles', parseInt(e.target.value))}
                  >
                    <option value="5">5 filas</option>
                    <option value="10">10 filas</option>
                    <option value="15">15 filas</option>
                    <option value="20">20 filas</option>
                    <option value="25">25 filas</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Color de Encabezado</label>
                  <div className="input-group">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={configuracion.tablas.colorEncabezado}
                      onChange={(e) => handleInputChange('tablas', 'colorEncabezado', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={configuracion.tablas.colorEncabezado}
                      onChange={(e) => handleInputChange('tablas', 'colorEncabezado', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Color de Filas Pares</label>
                  <div className="input-group">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={configuracion.tablas.colorFilasPares}
                      onChange={(e) => handleInputChange('tablas', 'colorFilasPares', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={configuracion.tablas.colorFilasPares}
                      onChange={(e) => handleInputChange('tablas', 'colorFilasPares', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Color de Filas Impares</label>
                  <div className="input-group">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={configuracion.tablas.colorFilasImpares}
                      onChange={(e) => handleInputChange('tablas', 'colorFilasImpares', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={configuracion.tablas.colorFilasImpares}
                      onChange={(e) => handleInputChange('tablas', 'colorFilasImpares', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Color al Pasar el Mouse</label>
                <div className="input-group">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={configuracion.tablas.colorHover}
                    onChange={(e) => handleInputChange('tablas', 'colorHover', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={configuracion.tablas.colorHover}
                    onChange={(e) => handleInputChange('tablas', 'colorHover', e.target.value)}
                  />
                </div>
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Los cambios en las tablas se aplicarán inmediatamente después de guardar.
              </div>
            </div>
          )}

          {activeTab === 'modulos' && (
            <div>
              <h5 className="mb-4">Activación de Módulos</h5>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.ventas}
                      onChange={(e) => handleInputChange('modulos', 'ventas', e.target.checked)}
                    />
                    <label className="form-check-label">Ventas</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.compras}
                      onChange={(e) => handleInputChange('modulos', 'compras', e.target.checked)}
                    />
                    <label className="form-check-label">Compras</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.gastos}
                      onChange={(e) => handleInputChange('modulos', 'gastos', e.target.checked)}
                    />
                    <label className="form-check-label">Gastos</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.clientes}
                      onChange={(e) => handleInputChange('modulos', 'clientes', e.target.checked)}
                    />
                    <label className="form-check-label">Clientes</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.proveedores}
                      onChange={(e) => handleInputChange('modulos', 'proveedores', e.target.checked)}
                    />
                    <label className="form-check-label">Proveedores</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.personal}
                      onChange={(e) => handleInputChange('modulos', 'personal', e.target.checked)}
                    />
                    <label className="form-check-label">Personal</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.nomina}
                      onChange={(e) => handleInputChange('modulos', 'nomina', e.target.checked)}
                    />
                    <label className="form-check-label">Nómina</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.banco}
                      onChange={(e) => handleInputChange('modulos', 'banco', e.target.checked)}
                    />
                    <label className="form-check-label">Banco</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.cheques}
                      onChange={(e) => handleInputChange('modulos', 'cheques', e.target.checked)}
                    />
                    <label className="form-check-label">Cheques</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.activos}
                      onChange={(e) => handleInputChange('modulos', 'activos', e.target.checked)}
                    />
                    <label className="form-check-label">Activos</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.servicios}
                      onChange={(e) => handleInputChange('modulos', 'servicios', e.target.checked)}
                    />
                    <label className="form-check-label">Servicios</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.recurrente}
                      onChange={(e) => handleInputChange('modulos', 'recurrente', e.target.checked)}
                    />
                    <label className="form-check-label">Recurrente</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.otrosIngresos}
                      onChange={(e) => handleInputChange('modulos', 'otrosIngresos', e.target.checked)}
                    />
                    <label className="form-check-label">Otros Ingresos</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.otrosEgresos}
                      onChange={(e) => handleInputChange('modulos', 'otrosEgresos', e.target.checked)}
                    />
                    <label className="form-check-label">Otros Egresos</label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.modulos.informes}
                      onChange={(e) => handleInputChange('modulos', 'informes', e.target.checked)}
                    />
                    <label className="form-check-label">Informes</label>
                  </div>
                </div>
              </div>

              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Los cambios en la activación de módulos requieren reiniciar la aplicación.
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div>
              <h5 className="mb-4">Configuración de Notificaciones</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.ventasNuevas}
                      onChange={(e) => handleInputChange('notificaciones', 'ventasNuevas', e.target.checked)}
                    />
                    <label className="form-check-label">Nuevas Ventas</label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.comprasNuevas}
                      onChange={(e) => handleInputChange('notificaciones', 'comprasNuevas', e.target.checked)}
                    />
                    <label className="form-check-label">Nuevas Compras</label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.pagosVencidos}
                      onChange={(e) => handleInputChange('notificaciones', 'pagosVencidos', e.target.checked)}
                    />
                    <label className="form-check-label">Pagos Vencidos</label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.cobrosVencidos}
                      onChange={(e) => handleInputChange('notificaciones', 'cobrosVencidos', e.target.checked)}
                    />
                    <label className="form-check-label">Cobros Vencidos</label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.stockBajo}
                      onChange={(e) => handleInputChange('notificaciones', 'stockBajo', e.target.checked)}
                    />
                    <label className="form-check-label">Stock Bajo</label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.serviciosVencidos}
                      onChange={(e) => handleInputChange('notificaciones', 'serviciosVencidos', e.target.checked)}
                    />
                    <label className="form-check-label">Servicios Vencidos</label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.cumpleanosPersonal}
                      onChange={(e) => handleInputChange('notificaciones', 'cumpleanosPersonal', e.target.checked)}
                    />
                    <label className="form-check-label">Cumpleaños del Personal</label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={configuracion.notificaciones.vencimientoContratos}
                      onChange={(e) => handleInputChange('notificaciones', 'vencimientoContratos', e.target.checked)}
                    />
                    <label className="form-check-label">Vencimiento de Contratos</label>
                  </div>
                </div>
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Las notificaciones se mostrarán en la parte superior derecha de la pantalla.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Personaliza;