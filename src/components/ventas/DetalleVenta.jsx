import React from 'react';

function DetalleVenta({ venta, onClose }) {
  // Evitar pantalla en blanco si `venta` aún no está cargada
  if (!venta) {
    return (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Detalle de Venta</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="text-muted">Cargando detalle...</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metodoPago = venta?.metodos_pago ?? venta?.metodoPago ?? '';

  const formatFecha = (value) => {
    if (!value) return '';
    try {
      // Si viene en formato YYYY-MM-DD (posible parte de ISO), crear fecha en zona local
      if (typeof value === 'string') {
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          const y = Number(m[1]);
          const mo = Number(m[2]) - 1;
          const day = Number(m[3]);
          const dLocal = new Date(y, mo, day);
          const dd = String(dLocal.getDate()).padStart(2, '0');
          const mm = String(dLocal.getMonth() + 1).padStart(2, '0');
          const yyyy = dLocal.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        }
      }

      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return String(value).slice(0, 10);
    }
  };

  const formatMoney = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '-';
    return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const clienteLabel =
    (typeof venta?.cliente === 'string' ? venta.cliente : null) ??
    (venta?.cliente?.nombre || venta?.cliente?.razon_social || venta?.cliente?.razonSocial || venta?.cliente?.name || null) ??
    (venta?.cliente_id ? `Cliente #${venta.cliente_id}` : '-')
    ;

  const folioLabel = venta?.folioVenta ?? venta?.folio_venta ?? venta?.folio ?? venta?.numero_folio ?? venta?.id ?? '-';
  const documentoLabel = venta?.documentoVenta ?? venta?.documento_venta ?? venta?.documento ?? '-';
  const sucursalLabel =
    venta?.sucursal_nombre ??
    venta?.sucursal ??
    venta?.sucursal?.nombre ??
    (venta?.sucursal_id ? `Sucursal #${venta.sucursal_id}` : '-');

  const observacionesLabel = venta?.observaciones ?? venta?.observacion ?? '';

  const detalles = Array.isArray(venta?.detalles) ? venta.detalles : [];

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Detalle de Venta</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Arriba: SOLO información general */}
            <div className="mb-2">
              <h6>Información General</h6>
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <th>Folio:</th>
                    <td>{folioLabel}</td>
                  </tr>
                  <tr>
                    <th>Documento venta:</th>
                    <td>{documentoLabel}</td>
                  </tr>
                  <tr>
                    <th>Sucursal:</th>
                    <td>{sucursalLabel}</td>
                  </tr>
                  <tr>
                    <th>Fecha:</th>
                    <td>{formatFecha(venta.fecha)}</td>
                  </tr>
                  <tr>
                    <th>Cliente:</th>
                    <td>{clienteLabel}</td>
                  </tr>
                  <tr>
                    <th>Estado:</th>
                    <td>
                      {venta.estado ? (
                        <span className={`badge bg-${String(venta.estado).toLowerCase() === 'pagada' ? 'success' : 'warning'}`}>
                          {String(venta.estado).charAt(0).toUpperCase() + String(venta.estado).slice(1)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Método de pago:</th>
                    <td>{metodoPago || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {(observacionesLabel || '').toString().trim() !== '' && (
              <div className="mb-3">
                <h6>Observaciones</h6>
                <div className="border rounded p-2 bg-light">{observacionesLabel}</div>
              </div>
            )}

            <div className="mt-2">
              <h6>Detalle (ítems)</h6>
              {detalles.length === 0 ? (
                <div className="text-muted">Sin ítems</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '45%' }}>Descripción</th>
                        <th style={{ width: '15%' }} className="text-end">Cantidad</th>
                        <th style={{ width: '20%' }} className="text-end">Precio Unitario</th>
                        <th style={{ width: '20%' }} className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalles.map((d, idx) => {
                        const cantidad = Number(d?.cantidad ?? 0) || 0;
                        const precio = Number(d?.precio_unitario ?? d?.precioUnitario ?? 0) || 0;
                        const totalLinea = Number(d?.total_linea ?? (cantidad * precio)) || 0;
                        return (
                          <tr key={d?.id ?? idx}>
                            <td>{d?.descripcion ?? '-'}</td>
                            <td className="text-end">{cantidad}</td>
                            <td className="text-end">${formatMoney(precio)}</td>
                            <td className="text-end">${formatMoney(totalLinea)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Abajo: RESUMEN debajo de la tabla de ítems (sin el título 'Resumen') */}
            <div className="mt-3">
              <div className="table-responsive">
                <table className="table table-sm table-borderless align-middle">
                  <colgroup>
                    <col style={{ width: '45%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td></td>
                      <td></td>
                      <th className="text-end">Subtotal:</th>
                      <td className="text-end">${formatMoney(venta.subtotal)}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <th className="text-end">IVA (19%):</th>
                      <td className="text-end">${formatMoney(venta.iva)}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <th className="text-end">Total:</th>
                      <td className="text-end fw-bold">${formatMoney(venta.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleVenta;