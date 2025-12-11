import React, { useState, useEffect } from 'react';
import NuevoProveedor from '../components/proveedores/NuevoProveedor';
import DetalleProveedor from '../components/proveedores/DetalleProveedor';
import EditarProveedor from '../components/proveedores/EditarProveedor';
import { exportToExcel, prepareDataForExport } from '../utils/exportUtils';
import { fetchProveedores, createProveedor, updateProveedor, inactivateProveedor } from '../utils/configApi';

function Proveedores() {
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    ciudad: ''
  });

  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normaliza el objeto recibido desde el backend a las claves que usa la UI
  const adaptProveedor = (p) => ({
    id: p.id,
    rut: p.rut,
    razonSocial: p.razon_social,
    giro: p.giro || null,
    nombreFantasia: p.nombre_comercial || p.nombre_fantasia || null,
    paginaWeb: p.pagina_web || null,
    ciudad: p.ciudad,
    contactoPrincipal: p.nombre_vendedor || '',
    telefonoPrincipal: p.telefono || p.celular || p.celular_vendedor || '',
    emailPrincipal: p.correo || p.correo_vendedor || '',
    metodoPago: p.metodo_pago,
    estado: p.estado,
    direccion: p.direccion,
    comuna: p.comuna,
    region: p.region,
    observacion: p.comentario || p.observacion || null,
    pagina_web: p.pagina_web || null,
    correo_finanzas: p.correo_finanzas || null,
    nombre_vendedor: p.nombre_vendedor || null,
    celular_vendedor: p.celular_vendedor || null,
    correo_vendedor: p.correo_vendedor || null,
    telefono: p.telefono || null,
    celular: p.celular || null,
    metodo_pago: p.metodo_pago || null,
    comentario: p.comentario || null,
    limiteCredito: p.limite_credito != null ? Number(p.limite_credito) : null,
    banco_nombre_titular: p.banco_nombre_titular || null,
    banco_rut_titular: p.banco_rut_titular || null,
    banco_nombre: p.banco_nombre || null,
    banco_tipo_cuenta: p.banco_tipo_cuenta || null,
    banco_numero_cuenta: p.banco_numero_cuenta || null,
    banco_correo: p.banco_correo || null,
    historialEstados: p.historial_estados || [],
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchProveedores();
        setProveedores((data || []).map(adaptProveedor));
      } catch (error) {
        console.error('Error cargando proveedores', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportarExcel = () => {
    (async () => {
      try {
        const backend = await fetchProveedores();
        const rows = backend.map(({ created_at, updated_at, deleted_at, ...rest }) => {
          const normalized = {};
          for (const [k, v] of Object.entries(rest)) {
            if (v === null || v === undefined) normalized[k] = '';
            else if (Array.isArray(v) || typeof v === 'object') normalized[k] = JSON.stringify(v);
            else normalized[k] = v;
          }
          return normalized;
        });
        const prepared = prepareDataForExport(rows);
        exportToExcel(prepared, 'Proveedores');
      } catch (err) {
        console.error('Error exportando proveedores', err);
        alert('Error exportando proveedores');
      }
    })();
  };

  // Obtener ciudades únicas para el filtro
  const ciudadesUnicas = [...new Set(proveedores.map(proveedor => proveedor.ciudad))];

  // Filtrar proveedores
  const proveedoresFiltrados = proveedores.filter(proveedor => {
    const cumpleBusqueda = !filtros.busqueda || 
      proveedor.rut.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      proveedor.razonSocial.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (proveedor.nombreFantasia && proveedor.nombreFantasia.toLowerCase().includes(filtros.busqueda.toLowerCase()));
    
    const cumpleEstado = !filtros.estado || proveedor.estado === filtros.estado;
    const cumpleCiudad = !filtros.ciudad || proveedor.ciudad === filtros.ciudad;

    return cumpleBusqueda && cumpleEstado && cumpleCiudad;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Proveedores</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoProveedor(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Proveedor
          </button>
          <button 
            className="btn btn-success"
            onClick={handleExportarExcel}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Buscar</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por RUT, Razón Social o Nombre Fantasía..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Ciudad</label>
              <select
                className="form-select"
                value={filtros.ciudad}
                onChange={(e) => setFiltros({...filtros, ciudad: e.target.value})}
              >
                <option value="">Todas</option>
                {ciudadesUnicas.map((ciudad, index) => (
                  <option key={index} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Proveedores */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Total Proveedores</h6>
              <h3>{proveedores.length}</h3>
              <small>Proveedores registrados</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Proveedores Activos</h6>
              <h3>{proveedores.filter(p => p.estado === 'activo').length}</h3>
              <small>En operación</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Nuevos este Mes</h6>
              <h3>0</h3>
              <small>Últimos 30 días</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Inactivos</h6>
              <h3>{proveedores.filter(p => p.estado === 'inactivo').length}</h3>
              <small>Sin operación</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Lista de Proveedores</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>RUT</th>
                  <th>Razón Social</th>
                  <th>Nombre Fantasía</th>
                  <th>Ciudad</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedoresFiltrados.map((proveedor) => (
                  <tr key={proveedor.id}>
                    <td>{proveedor.rut}</td>
                    <td>{proveedor.razonSocial}</td>
                    <td>{proveedor.nombreFantasia || '-'}</td>
                    <td>{proveedor.ciudad}</td>
                    <td>{proveedor.contactoPrincipal}</td>
                    <td>{proveedor.telefonoPrincipal}</td>
                    <td>{proveedor.emailPrincipal}</td>
                    <td>
                      <span className={`badge bg-${proveedor.estado === 'activo' ? 'success' : 'danger'}`}>
                        {proveedor.estado.charAt(0).toUpperCase() + proveedor.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                                setProveedorSeleccionado(proveedor);
                                setShowDetalle(true);
                              }}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => {
                            setProveedorSeleccionado(proveedor);
                            setShowEditar(true);
                          }}
                          title="Editar proveedor"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {proveedor.estado === 'activo' && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              if (window.confirm('¿Está seguro de inactivar este proveedor?')) {
                                (async () => {
                                  try {
                                    await inactivateProveedor(proveedor.id);
                                    setProveedores(prev => prev.map(p => p.id === proveedor.id ? { ...p, estado: 'inactivo', historialEstados: [...(p.historialEstados||[]), { fecha: new Date().toISOString(), usuario: 'Usuario', accion: 'Inactivación', detalles: 'Inactivado desde UI' }] } : p));
                                  } catch (error) {
                                    console.error('Error inactivando proveedor', error);
                                    alert('Error inactivando proveedor');
                                  }
                                })();
                              }
                            }}
                            title="Inactivar proveedor"
                          >
                            <i className="bi bi-person-x"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {proveedoresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No se encontraron proveedores con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevoProveedor && (
        <NuevoProveedor
          onClose={() => setShowNuevoProveedor(false)}
          onSave={(data) => {
            (async () => {
              try {
                const payload = {
                  razon_social: data.razonSocial,
                  rut: data.rut,
                  nombre_comercial: data.nombreComercial || data.nombreFantasia || null,
                  giro: data.giro || null,
                  pagina_web: data.paginaWeb || null,
                  ciudad: data.ciudad || null,
                  limite_credito: data.limiteCredito ? parseFloat(data.limiteCredito) : null,
                  comuna: data.comuna || null,
                  region: data.region || null,
                  direccion: data.direccion || null,
                  correo: data.correo || null,
                  correo_finanzas: data.correoFinanzas || null,
                  telefono: data.telefono || null,
                  celular: data.celular || null,
                  nombre_vendedor: data.nombreVendedor || null,
                  celular_vendedor: data.celularVendedor || null,
                  correo_vendedor: data.correoVendedor || null,
                  metodo_pago: data.metodoPago || 'efectivo',
                  banco_nombre_titular: data.datosBancarios?.nombre || null,
                  banco_rut_titular: data.datosBancarios?.rut || null,
                  banco_nombre: data.datosBancarios?.banco || null,
                  banco_tipo_cuenta: data.datosBancarios?.tipoCuenta || null,
                  banco_numero_cuenta: data.datosBancarios?.numeroCuenta || null,
                  banco_correo: data.datosBancarios?.correo || null,
                  comentario: data.comentario || null,
                };

                const res = await createProveedor(payload);
                const p = res.proveedor;
                setProveedores(prev => [...prev, adaptProveedor(p)]);
              } catch (error) {
                console.error('Error creando proveedor', error);
                alert('Error creando proveedor');
              } finally {
                setShowNuevoProveedor(false);
              }
            })();
          }}
        />
      )}

      {showDetalle && proveedorSeleccionado && (
        <DetalleProveedor
          proveedor={proveedorSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setProveedorSeleccionado(null);
          }}
        />
      )}

      {showEditar && proveedorSeleccionado && (
        <EditarProveedor
          proveedor={proveedorSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setProveedorSeleccionado(null);
          }}
          onSave={(proveedorEditado) => {
            (async () => {
              try {
                const payload = {
                  razon_social: proveedorEditado.razonSocial,
                  rut: proveedorEditado.rut,
                  nombre_comercial: proveedorEditado.nombreFantasia,
                  giro: proveedorEditado.giro || null,
                  pagina_web: proveedorEditado.paginaWeb || null,
                  ciudad: proveedorEditado.ciudad || null,
                  limite_credito: proveedorEditado.limiteCredito ? parseFloat(proveedorEditado.limiteCredito) : null,
                  comuna: proveedorEditado.comuna || null,
                  region: proveedorEditado.region || null,
                  direccion: proveedorEditado.direccion || null,
                  correo: proveedorEditado.emailPrincipal || null,
                  correo_finanzas: proveedorEditado.correo_finanzas || null,
                  telefono: proveedorEditado.telefono || proveedorEditado.telefonoPrincipal || null,
                  celular: proveedorEditado.celular || null,
                  nombre_vendedor: proveedorEditado.nombre_vendedor || proveedorEditado.contactoPrincipal || null,
                  celular_vendedor: proveedorEditado.celular_vendedor || proveedorEditado.telefonoPagos || null,
                  correo_vendedor: proveedorEditado.correo_vendedor || proveedorEditado.emailPagos || null,
                  metodo_pago: proveedorEditado.metodoPago || 'efectivo',
                  banco_nombre_titular: proveedorEditado.banco_nombre_titular || proveedorEditado.bancoNombreTitular || null,
                  banco_rut_titular: proveedorEditado.banco_rut_titular || proveedorEditado.bancoRutTitular || null,
                  banco_nombre: proveedorEditado.banco_nombre || proveedorEditado.bancoNombre || null,
                  banco_tipo_cuenta: proveedorEditado.banco_tipo_cuenta || proveedorEditado.bancoTipoCuenta || null,
                  banco_numero_cuenta: proveedorEditado.banco_numero_cuenta || proveedorEditado.bancoNumeroCuenta || null,
                  banco_correo: proveedorEditado.banco_correo || proveedorEditado.bancoCorreo || null,
                  comentario: proveedorEditado.observaciones || proveedorEditado.comentario || null,
                };

                const res = await updateProveedor(proveedorEditado.id, payload);
                const p = res.proveedor;
                setProveedores(prev => prev.map(item => item.id === p.id ? adaptProveedor(p) : item));
              } catch (error) {
                console.error('Error actualizando proveedor', error);
                alert('Error actualizando proveedor');
              } finally {
                setShowEditar(false);
                setProveedorSeleccionado(null);
              }
            })();
          }}
        />
      )}
    </div>
  );
}

export default Proveedores;