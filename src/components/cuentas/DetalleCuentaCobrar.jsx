import React from 'react';

// Helper para parsear fechas y formatear a DD/MM/YYYY
const parseDate = (val) => {
  if (!val) return null;
  try {
    if (typeof val === 'string') {
      const m = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const day = Number(m[3]);
        const dLocal = new Date(y, mo, day);
        if (!isNaN(dLocal)) return dLocal;
      }
    }
    const d = new Date(val);
    if (isNaN(d)) return null;
    return d;
  } catch {
    return null;
  }
};

const formatDate = (val) => {
  const d = parseDate(val);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatMoney = (v) => {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

function DetalleCuentaCobrar({ cuenta, onClose }) {
  if (!cuenta) return null;

  // Campos con posibles nombres distintos en origen de datos
  const contacto = cuenta.contacto ?? cuenta.contacto_nombre ?? cuenta.cliente_contacto ?? '';
  const telefono = cuenta.telefono ?? cuenta.telefono_contacto ?? cuenta.contacto_telefono ?? '';
  const numeroDocumento = cuenta.numeroDocumento ?? cuenta.documento ?? cuenta.folio ?? cuenta.numero ?? '';
  const tipoDocumento = cuenta.tipoDocumento ?? cuenta.tipo_documento ?? cuenta.documentoTipo ?? '';
  // Mostrar las fechas tal cual vienen de la base de datos
  const fechaEmision = cuenta.fechaEmision ?? cuenta.fecha ?? cuenta.fecha_emision ?? '';
  const fechaVencimiento = cuenta.fechaVencimiento ?? cuenta.fecha_final ?? cuenta.fecha_vencimiento ?? '';
  const montoTotal = Number(cuenta.montoTotal ?? cuenta.total ?? cuenta.monto ?? 0);
  const montoPagado = Number(cuenta.montoPagado ?? cuenta.monto_pagado ?? cuenta.pagado ?? 0);
  const saldoPendiente = Math.max(0, montoTotal - montoPagado);

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">Detalle de Cuenta por Cobrar</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Información del Cliente</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Cliente:</th>
                      <td>{cuenta.cliente}</td>
                    </tr>
                    <tr>
                      <th>RUT:</th>
                      <td>{cuenta.rut}</td>
                    </tr>
                    <tr>
                      <th>Contacto:</th>
                      <td>{contacto}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>{telefono}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Detalles de la Deuda</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>N° Documento:</th>
                      <td>{numeroDocumento}</td>
                    </tr>
                    <tr>
                      <th>Tipo Documento:</th>
                      <td>{tipoDocumento}</td>
                    </tr>
                    <tr>
                      <th>Fecha Emisión:</th>
                      <td>{formatDate(fechaEmision)}</td>
                    </tr>
                    <tr>
                      <th>Fecha Vencimiento:</th>
                      <td>{formatDate(fechaVencimiento)}</td>
                    </tr>
                    <tr>
                      <th>Monto Total:</th>
                      <td className="fw-bold">${formatMoney(montoTotal)}</td>
                    </tr>
                    <tr>
                      <th>Monto Pagado:</th>
                      <td className="text-success">${formatMoney(montoPagado)}</td>
                    </tr>
                    <tr>
                      <th>Saldo Pendiente:</th>
                      <td className="text-danger">${formatMoney(saldoPendiente)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Historial de Pagos</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Método de Pago</th>
                      <th>Comprobante</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuenta.historialPagos?.map((pago, index) => (
                      <tr key={index}>
                        <td>{formatDate(pago.fecha)}</td>
                        <td>${formatMoney(pago.monto)}</td>
                        <td>{pago.metodoPago ?? pago.metodo ?? pago.metodo_pago}</td>
                        <td>{pago.comprobante}</td>
                        <td>{pago.usuario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6>Observaciones</h6>
              <p>{cuenta.observaciones ?? cuenta.observacion ?? 'Sin observaciones'}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-success">
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleCuentaCobrar;