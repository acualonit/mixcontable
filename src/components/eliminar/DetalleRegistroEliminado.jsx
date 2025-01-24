import React from 'react';

function DetalleRegistroEliminado({ registro, onClose }) {
  const renderDetalleSegunModulo = () => {
    switch (registro.modulo) {
      case 'Ventas':
        return (
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Detalle de la Venta</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Cliente:</strong> {registro.detalleOriginal.cliente}</p>
                  <p><strong>Fecha:</strong> {registro.detalleOriginal.fecha}</p>
                </div>
              </div>
              <h6 className="mt-3">Items</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registro.detalleOriginal.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.descripcion}</td>
                        <td>{item.cantidad}</td>
                        <td>${item.precio.toLocaleString()}</td>
                        <td>${(item.cantidad * item.precio).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      // Agregar más casos según los módulos
      default:
        return (
          <div className="alert alert-info">
            No hay detalles adicionales disponibles para este tipo de registro.
          </div>
        );
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Registro Eliminado</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Información General */}
            <div className="card mb-3">
              <div className="card-header bg-light">
                <h6 className="mb-0">Información de la Eliminación</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Fecha:</strong> {registro.fecha}</p>
                    <p><strong>Hora:</strong> {registro.hora}</p>
                    <p><strong>Módulo:</strong> {registro.modulo}</p>
                    <p><strong>Tipo de Registro:</strong> {registro.tipoRegistro}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>N° Documento:</strong> {registro.numeroDocumento}</p>
                    <p><strong>Valor:</strong> ${registro.valor.toLocaleString()}</p>
                    <p><strong>Usuario:</strong> {registro.usuario}</p>
                    <p><strong>Motivo:</strong> {registro.motivo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalle según el módulo */}
            {renderDetalleSegunModulo()}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary">
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleRegistroEliminado;