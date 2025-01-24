import React, { useState } from 'react';
import { exportToExcel } from '../utils/exportUtils';
import DetalleRegistroEliminado from '../components/eliminar/DetalleRegistroEliminado';

function Eliminar() {
  const [filtros, setFiltros] = useState({
    modulo: '',
    fechaInicio: '',
    fechaFin: '',
    usuario: ''
  });

  const [showDetalle, setShowDetalle] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Datos de ejemplo para registros eliminados
  const [registrosEliminados] = useState([
    {
      id: 1,
      fecha: '2024-01-20',
      hora: '15:30',
      modulo: 'Ventas',
      tipoRegistro: 'Factura',
      numeroDocumento: '1234',
      valor: 500000,
      usuario: 'Juan Pérez',
      motivo: 'Documento anulado por error en datos',
      detalleOriginal: {
        cliente: 'Cliente A',
        fecha: '2024-01-20',
        items: [
          { descripcion: 'Producto 1', cantidad: 2, precio: 150000 },
          { descripcion: 'Producto 2', cantidad: 1, precio: 200000 }
        ]
      }
    }
  ]);

  const handleExportarExcel = () => {
    const dataToExport = registrosEliminados.map(registro => ({
      'Fecha': registro.fecha,
      'Hora': registro.hora,
      'Módulo': registro.modulo,
      'Tipo de Registro': registro.tipoRegistro,
      'N° Documento': registro.numeroDocumento,
      'Valor': registro.valor,
      'Usuario': registro.usuario,
      'Motivo': registro.motivo
    }));

    exportToExcel(dataToExport, 'Registros_Eliminados');
  };

  const handleVerDetalle = (registro) => {
    setRegistroSeleccionado(registro);
    setShowDetalle(true);
  };

  // Filtrar registros
  const registrosFiltrados = registrosEliminados.filter(registro => {
    const cumpleModulo = !filtros.modulo || registro.modulo === filtros.modulo;
    const cumpleFechaInicio = !filtros.fechaInicio || registro.fecha >= filtros.fechaInicio;
    const cumpleFechaFin = !filtros.fechaFin || registro.fecha <= filtros.fechaFin;
    const cumpleUsuario = !filtros.usuario || registro.usuario.toLowerCase().includes(filtros.usuario.toLowerCase());

    return cumpleModulo && cumpleFechaInicio && cumpleFechaFin && cumpleUsuario;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Registros Eliminados</h2>
        <button 
          className="btn btn-success"
          onClick={handleExportarExcel}
        >
          <i className="bi bi-file-earmark-excel me-2"></i>
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Módulo</label>
              <select
                className="form-select"
                value={filtros.modulo}
                onChange={(e) => setFiltros({...filtros, modulo: e.target.value})}
              >
                <option value="">Todos los módulos</option>
                <option value="Ventas">Ventas</option>
                <option value="Compras">Compras</option>
                <option value="Gastos">Gastos</option>
                <option value="Clientes">Clientes</option>
                <option value="Proveedores">Proveedores</option>
                <option value="Activos">Activos</option>
                <option value="Personal">Personal</option>
                <option value="Servicios">Servicios</option>
                <option value="Banco">Banco</option>
                <option value="Cheques">Cheques</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Usuario</label>
              <input
                type="text"
                className="form-control"
                value={filtros.usuario}
                onChange={(e) => setFiltros({...filtros, usuario: e.target.value})}
                placeholder="Buscar por usuario..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6 className="card-title">Total Registros Eliminados</h6>
              <h3>{registrosFiltrados.length}</h3>
              <small>En el período seleccionado</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Valor Total Eliminado</h6>
              <h3>${registrosFiltrados.reduce((sum, reg) => sum + reg.valor, 0).toLocaleString()}</h3>
              <small>Suma de registros eliminados</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registros Eliminados */}
      <div className="card">
        <div className="card-header bg-danger text-white">
          <h5 className="card-title mb-0">Historial de Eliminaciones</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Módulo</th>
                  <th>Tipo de Registro</th>
                  <th>N° Documento</th>
                  <th>Valor</th>
                  <th>Usuario</th>
                  <th>Motivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((registro) => (
                  <tr key={registro.id}>
                    <td>{registro.fecha}</td>
                    <td>{registro.hora}</td>
                    <td>{registro.modulo}</td>
                    <td>{registro.tipoRegistro}</td>
                    <td>{registro.numeroDocumento}</td>
                    <td>${registro.valor.toLocaleString()}</td>
                    <td>{registro.usuario}</td>
                    <td>{registro.motivo}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleVerDetalle(registro)}
                        title="Ver detalle del registro original"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {registrosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No se encontraron registros eliminados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      {showDetalle && registroSeleccionado && (
        <DetalleRegistroEliminado
          registro={registroSeleccionado}
          onClose={() => {
            setShowDetalle(false);
            setRegistroSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}

export default Eliminar;