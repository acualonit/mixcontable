import React, { useState, useEffect } from 'react';
import NuevoCliente from '../components/clientes/NuevoCliente';
import DetalleCliente from '../components/clientes/DetalleCliente';
import EditarCliente from '../components/clientes/EditarCliente';
import InactivarCliente from '../components/clientes/InactivarCliente';
import HistorialInactivos from '../components/clientes/HistorialInactivos';
import { exportToExcel, prepareDataForExport } from '../utils/exportUtils';
import { fetchClientes, createCliente, updateCliente, inactivateCliente } from '../utils/configApi';

function Clientes() {
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showInactivar, setShowInactivar] = useState(false);
  const [showHistorialInactivos, setShowHistorialInactivos] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estado para filtros y búsqueda
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    condicionVenta: '',
    ciudad: ''
  });

  // Estado para la lista de clientes (se carga desde API)
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchClientes();
        // adapt backend keys (snake_case) -> frontend camelCase
        const adapt = (c) => ({
          id: c.id,
          rut: c.rut,
          razonSocial: c.razon_social,
          nombreFantasia: c.nombre_fantasia,
          giro: c.giro,
          ciudad: c.ciudad,
          comuna: c.comuna,
          region: c.region,
          direccion: c.direccion,
          contactoCobranza: c.contacto_cobranza,
          telefonoCobranza: c.tel_cobranza,
          emailCobranza: c.email_cobranza,
          contactoPrincipal: c.contacto_principal,
          telefonoPrincipal: c.telefono_principal,
          emailPrincipal: c.email_principal,
          limiteCredito: c.limite_credito,
          condicionVenta: c.condicion_venta,
          observaciones: c.observacion,
          estado: c.estado,
          historialEstados: c.historial_estados || [],
        });

        setClientes((data || []).map(adapt));
      } catch (error) {
        console.error('Error cargando clientes', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Función para filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro por búsqueda (RUT, Razón Social o Nombre Fantasía)
    const cumpleBusqueda = filtros.busqueda === '' || 
      cliente.rut.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      cliente.razonSocial.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (cliente.nombreFantasia && cliente.nombreFantasia.toLowerCase().includes(filtros.busqueda.toLowerCase()));

    // Filtro por estado
    const cumpleEstado = filtros.estado === '' || cliente.estado === filtros.estado;

    // Filtro por condición de venta
    const cumpleCondicionVenta = filtros.condicionVenta === '' || cliente.condicionVenta === filtros.condicionVenta;

    // Filtro por ciudad
    const cumpleCiudad = filtros.ciudad === '' || cliente.ciudad === filtros.ciudad;

    return cumpleBusqueda && cumpleEstado && cumpleCondicionVenta && cumpleCiudad;
  });

  // Obtener ciudades únicas para el filtro
  const ciudadesUnicas = [...new Set(clientes.map(cliente => cliente.ciudad))];

  const handleNuevoCliente = (cliente) => {
    (async () => {
      try {
        const payload = {
          rut: cliente.rut,
          razon_social: cliente.razonSocial,
          nombre_fantasia: cliente.nombreFantasia,
          giro: cliente.giro,
          ciudad: cliente.ciudad,
          comuna: cliente.comuna,
          region: cliente.region,
          direccion: cliente.direccion,
          contacto_cobranza: cliente.contactoCobranza,
          tel_cobranza: cliente.telefonoCobranza,
          email_cobranza: cliente.emailCobranza,
          contacto_principal: cliente.contactoPrincipal,
          telefono_principal: cliente.telefonoPrincipal,
          email_principal: cliente.emailPrincipal,
          limite_credito: cliente.limiteCredito ? parseFloat(cliente.limiteCredito) : null,
          condicion_venta: cliente.condicionVenta || '0',
          observacion: cliente.observaciones || null,
        };
        const res = await createCliente(payload);
        const c = res.cliente;
        setClientes((prev) => [
          ...prev,
          {
            id: c.id,
            rut: c.rut,
            razonSocial: c.razon_social,
            nombreFantasia: c.nombre_fantasia,
            giro: c.giro,
            ciudad: c.ciudad,
            comuna: c.comuna,
            region: c.region,
            direccion: c.direccion,
            contactoCobranza: c.contacto_cobranza,
            telCobranza: c.tel_cobranza,
            emailCobranza: c.email_cobranza,
            contactoPrincipal: c.contacto_principal,
            telefonoPrincipal: c.telefono_principal,
            emailPrincipal: c.email_principal,
            limiteCredito: c.limite_credito,
            condicionVenta: c.condicion_venta,
            observaciones: c.observacion,
            estado: c.estado,
            historialEstados: c.historial_estados || [],
          },
        ]);
      } catch (error) {
        console.error('Error creando cliente', error);
      }
    })();
  };

  const handleVerDetalle = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowDetalle(true);
  };

  const handleEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowEditar(true);
  };

  const handleGuardarEdicion = (clienteEditado) => {
    (async () => {
      try {
        const payload = {
          rut: clienteEditado.rut,
          razon_social: clienteEditado.razonSocial,
          nombre_fantasia: clienteEditado.nombreFantasia,
          giro: clienteEditado.giro,
          ciudad: clienteEditado.ciudad,
          comuna: clienteEditado.comuna,
          region: clienteEditado.region,
          direccion: clienteEditado.direccion,
          contacto_cobranza: clienteEditado.contactoCobranza,
          tel_cobranza: clienteEditado.telCobranza,
          email_cobranza: clienteEditado.emailCobranza,
          contacto_principal: clienteEditado.contactoPrincipal,
          telefono_principal: clienteEditado.telefonoPrincipal,
          email_principal: clienteEditado.emailPrincipal,
          limite_credito: clienteEditado.limiteCredito || null,
          condicion_venta: clienteEditado.condicionVenta || '0',
          observacion: clienteEditado.observaciones || null,
        };
        const res = await updateCliente(clienteEditado.id, payload);
        const c = res.cliente;
        setClientes((prev) => prev.map((cliente) => (cliente.id === c.id ? {
          id: c.id,
          rut: c.rut,
          razonSocial: c.razon_social,
          nombreFantasia: c.nombre_fantasia,
          giro: c.giro,
          ciudad: c.ciudad,
          comuna: c.comuna,
          region: c.region,
          direccion: c.direccion,
          contactoCobranza: c.contacto_cobranza,
          telefonoCobranza: c.tel_cobranza,
          emailCobranza: c.email_cobranza,
          contactoPrincipal: c.contacto_principal,
          telefonoPrincipal: c.telefono_principal,
          emailPrincipal: c.email_principal,
          limiteCredito: c.limite_credito,
          condicionVenta: c.condicion_venta,
          observaciones: c.observacion,
          estado: c.estado,
          historialEstados: c.historial_estados || [],
        } : cliente)));
      } catch (error) {
        console.error('Error actualizando cliente', error);
      } finally {
        setShowEditar(false);
        setClienteSeleccionado(null);
      }
    })();
  };

  const handleInactivar = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowInactivar(true);
  };

  const handleConfirmarInactivacion = (data) => {
    (async () => {
      try {
        await inactivateCliente(data.clienteId);
        setClientes((prev) => prev.map((cliente) => (cliente.id === data.clienteId ? {
          ...cliente,
          estado: 'inactivo',
          historialEstados: [
            ...cliente.historialEstados,
            {
              fecha: data.fecha,
              usuario: data.usuario,
              accion: 'Inactivación',
              detalles: data.observaciones,
            },
          ],
        } : cliente)));
      } catch (error) {
        console.error('Error inactivando cliente', error);
      } finally {
        setShowInactivar(false);
        setClienteSeleccionado(null);
      }
    })();
  };

  const handleExportarExcel = () => {
    (async () => {
      try {
        // pedir al backend la lista completa (forma segura de obtener todos los campos)
        const backendClients = await fetchClientes();

        // Filtrar por los clientes mostrados (clientesFiltrados contiene objetos camelCase sin todos los campos),
        // así que seleccionamos desde backendClients aquellos que están en clientesFiltrados por id
        const visibleIds = new Set(clientesFiltrados.map(c => c.id));
        const rows = backendClients
          .filter(c => visibleIds.has(c.id))
          .map(c => {
            // eliminar timestamps
            const { created_at, updated_at, deleted_at, ...rest } = c;
            // convertir arrays/objetos a string para Excel
            const normalized = {};
            for (const [k, v] of Object.entries(rest)) {
              if (v === null || v === undefined) {
                normalized[k] = '';
              } else if (Array.isArray(v) || typeof v === 'object') {
                try {
                  normalized[k] = JSON.stringify(v);
                } catch (err) {
                  normalized[k] = String(v);
                }
              } else {
                normalized[k] = v;
              }
            }
            return normalized;
          });

        const prepared = prepareDataForExport(rows, { formatDates: true, formatNumbers: true });
        exportToExcel(prepared, 'Clientes');
      } catch (error) {
        console.error('Error exportando clientes:', error);
        alert('Error exportando clientes. Revisa la consola.');
      }
    })();
  };

  if (showHistorialInactivos) {
    return <HistorialInactivos onBack={() => setShowHistorialInactivos(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Clientes</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNuevoCliente(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Cliente
          </button>
          <button 
            className="btn btn-info"
            onClick={() => setShowHistorialInactivos(true)}
          >
            <i className="bi bi-clock-history me-2"></i>
            Historial Inactivos
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
            <div className="col-md-2 mb-3">
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
            <div className="col-md-2 mb-3">
              <label className="form-label">Condición Venta</label>
              <select
                className="form-select"
                value={filtros.condicionVenta}
                onChange={(e) => setFiltros({...filtros, condicionVenta: e.target.value})}
              >
                <option value="">Todas</option>
                <option value="0">Contado</option>
                <option value="30">30 días</option>
                <option value="45">45 días</option>
                <option value="60">60 días</option>
                <option value="90">90 días</option>
              </select>
            </div>
            <div className="col-md-2 mb-3">
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

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Lista de Clientes</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>RUT</th>
                  <th>Razón Social</th>
                  <th>Nombre Fantasía</th>
                  <th>Giro</th>
                  <th>Ciudad</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.rut}</td>
                    <td>{cliente.razonSocial}</td>
                    <td>{cliente.nombreFantasia || '-'}</td>
                    <td>{cliente.giro}</td>
                    <td>{cliente.ciudad}</td>
                    <td>{cliente.contactoPrincipal}</td>
                    <td>{cliente.telefonoPrincipal}</td>
                    <td>{cliente.emailPrincipal}</td>
                    <td>
                      <span className={`badge bg-${cliente.estado === 'activo' ? 'success' : 'danger'}`}>
                        {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerDetalle(cliente)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditar(cliente)}
                          title="Editar cliente"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {cliente.estado === 'activo' && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleInactivar(cliente)}
                            title="Inactivar cliente"
                          >
                            <i className="bi bi-person-x"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center">
                      No se encontraron clientes con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNuevoCliente && (
        <NuevoCliente 
          onClose={() => setShowNuevoCliente(false)}
          onSave={handleNuevoCliente}
        />
      )}

      {showDetalle && clienteSeleccionado && (
        <DetalleCliente 
          cliente={clienteSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setClienteSeleccionado(null);
          }}
        />
      )}

      {showEditar && clienteSeleccionado && (
        <EditarCliente
          cliente={clienteSeleccionado}
          onClose={() => {
            setShowEditar(false);
            setClienteSeleccionado(null);
          }}
          onSave={handleGuardarEdicion}
        />
      )}

      {showInactivar && clienteSeleccionado && (
        <InactivarCliente
          cliente={clienteSeleccionado}
          onClose={() => {
            setShowInactivar(false);
            setClienteSeleccionado(null);
          }}
          onConfirm={handleConfirmarInactivacion}
        />
      )}
    </div>
  );
}

export default Clientes;