import React from 'react';

function DetalleCheque({ cheque, onClose }) {
  const money = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const estado = (cheque?.estado || '').toString().toLowerCase();
  const estadoBadge = estado === 'pendiente'
    ? 'warning'
    : estado === 'cobrado'
      ? 'success'
      : estado === 'protestado'
        ? 'danger'
        : estado === 'anulado'
          ? 'secondary'
          : 'secondary';

  const usuario = cheque?.usuario || cheque?.raw?.usuario_nombre || cheque?.raw?.usuario || cheque?.raw?.user || '—';

  return (
    <div
      className="modal fade show"
      role="dialog"
      aria-modal="true"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle del Cheque</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <strong>Información General</strong>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between"><span>N° Cheque</span><strong>{cheque?.numero || '-'}</strong></div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between"><span>Tipo</span><strong>{cap(cheque?.tipo || '')}</strong></div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between"><span>Banco</span><strong>{cheque?.banco || '-'}</strong></div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Estado</span>
                      <span className={`badge bg-${estadoBadge}`}>{cap(estado) || '-'}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between"><span>Origen/Destino</span><strong>{cheque?.destinatario || '-'}</strong></div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <strong>Fechas y Montos</strong>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between"><span>Fecha Emisión</span><strong>{cheque?.fechaEmision || '-'}</strong></div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between"><span>Fecha Cobro</span><strong>{cheque?.fechaCobro || '-'}</strong></div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between"><span>Monto</span><strong>{money(cheque?.monto)}</strong></div>
                    {cheque?.observaciones ? (
                      <>
                        <hr className="my-2" />
                        <div>
                          <div className="text-muted small">Observaciones</div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{cheque.observaciones}</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card">
                  <div className="card-header bg-light">
                    <strong>Historial</strong>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Usuario</th>
                            <th>Observación</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{cheque?.fechaEmision || '-'}</td>
                            <td>{cap(estado) || '-'}</td>
                            <td>{usuario}</td>
                            <td>{cheque?.raw?.observaciones || cheque?.observaciones || '—'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleCheque;