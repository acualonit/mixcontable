import React, { useState, useEffect } from 'react';
import ventasApi from '../../utils/ventasApi';
import { fetchClienteByRut } from '../../utils/configApi';
import { exportToExcel } from '../../utils/exportUtils';
import DetalleVenta from './DetalleVenta';
import NuevaVenta from './NuevaVenta';

function VentasDiarias({ fecha, sucursal, onBack }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventaEnEdicion, setVentaEnEdicion] = useState(null);

  const normFecha = (f) => {
    if (!f) return null;
    if (f instanceof Date) {
      return f.toISOString().slice(0, 10);
    }
    if (typeof f === 'string') {
      const m = f.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : f;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    const f = normFecha(fecha);
    if (!f) return;
    setLoading(true);
    setError(null);
    ventasApi.listVentas({ fecha: f, ...(sucursal ? { sucursal } : {}) })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setVentas(list || []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Error cargando ventas por fecha', err);
        setError(err.message || 'Error al cargar ventas');
        setVentas([]);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [fecha, sucursal]);

  const calcularTotales = () => {
    const t = {
      efectivo: 0,
      transferencia: 0,
      tCredito: 0,
      tDebito: 0,
      cheque: 0,
      online: 0,
      creditoDeuda: 0,
      otros: 0,
      totalVenta: 0,
    };

    ventas.forEach(v => {
      const total = Number(v.total) || 0;
      t.totalVenta += total;

      // intentamos parsear `metodos_pago` si viene como JSON
      let pagos = null;
      if (v.metodos_pago) {
        if (typeof v.metodos_pago === 'string') {
          try { pagos = JSON.parse(v.metodos_pago); } catch (e) { pagos = v.metodos_pago; }
        } else {
          pagos = v.metodos_pago;
        }
      }

      if (Array.isArray(pagos)) {
        pagos.forEach(p => {
          const tipo = (p.tipo || p.metodo || '').toString().toLowerCase();
          const monto = Number(p.monto || p.valor || 0) || 0;
          if (tipo.includes('efect')) t.efectivo += monto;
          else if (tipo.includes('transfer')) t.transferencia += monto;
          else if (tipo.includes('credito')) t.tCredito += monto;
          else if (tipo.includes('debito')) t.tDebito += monto;
          else if (tipo.includes('cheque')) t.cheque += monto;
          else if (tipo.includes('online')) t.online += monto;
          else if (tipo.includes('credito_deuda') || tipo.includes('deuda')) t.creditoDeuda += monto;
          else t.otros += monto;
        });
      } else if (typeof pagos === 'object' && pagos !== null) {
        // if object with tipo and monto
        const tipo = (pagos.tipo || '').toString().toLowerCase();
        const monto = Number(pagos.monto || pagos.valor || total) || total;
        if (tipo.includes('efect')) t.efectivo += monto;
        else if (tipo.includes('transfer')) t.transferencia += monto;
        else if (tipo.includes('credito')) t.tCredito += monto;
        else if (tipo.includes('debito')) t.tDebito += monto;
        else if (tipo.includes('cheque')) t.cheque += monto;
        else if (tipo.includes('online')) t.online += monto;
        else if (tipo.includes('credito_deuda') || tipo.includes('deuda')) t.creditoDeuda += monto;
        else t.otros += monto;
      } else if (typeof pagos === 'string') {
        const tipo = pagos.toLowerCase();
        if (tipo.includes('efect')) t.efectivo += total;
        else if (tipo.includes('transfer')) t.transferencia += total;
        else if (tipo.includes('credito')) t.tCredito += total;
        else if (tipo.includes('debito')) t.tDebito += total;
        else if (tipo.includes('cheque')) t.cheque += total;
        else if (tipo.includes('online')) t.online += total;
        else if (tipo.includes('credito_deuda') || tipo.includes('deuda')) t.creditoDeuda += total;
        else t.otros += total;
      } else {
        // sin información de métodos => contabilizar todo en 'otros'
        t.otros += total;
      }
    });

    return t;
  };

  const formatMoney = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

  const totales = calcularTotales();

  const handleExport = async () => {
    try {
      // Export en frontend para poder aplicar estilo "Banco" al Excel de Ventas del día
      const f = normFecha(fecha);
      const res = await ventasApi.listVentas({ fecha: f, ...(sucursal ? { sucursal } : {}) });
      const list = Array.isArray(res) ? res : (res?.data ?? []);

      const dataToExport = (list || []).map(v => ({
        Fecha: (v.fecha || '').toString().slice(0, 10),
        Sucursal: v.sucursal_nombre ?? v.sucursal ?? '',
        Cliente: v.cliente_nombre ?? (typeof v.cliente === 'string' ? v.cliente : (v.cliente?.nombre ?? v.cliente?.razon_social ?? '')),
        RUT: v.cliente_rut ?? v.rut ?? v.rut_cliente ?? (v.cliente?.rut ?? v.cliente?.rut_cliente ?? ''),
        'Método de Pago': v.metodos_pago ?? v.metodoPago ?? '',
        Subtotal: Number(v.subtotal) || 0,
        IVA: Number(v.iva) || 0,
        Total: Number(v.total) || 0,
        Observación: v.observacion ?? v.observaciones ?? '',
      }));

      exportToExcel(dataToExport, `Ventas_Dia_${f || ''}`, { mode: 'banco' });
    } catch (err) {
      console.error('Error exportando', err);
      alert('Error al exportar');
    }
  };

  const handleDelete = async (v) => {
    try {
      // Preguntar al backend si la venta (Crédito/Deuda) tiene pagos registrados
      if (String(v?.metodos_pago ?? '').toLowerCase().trim() === 'credito (deuda)') {
        try {
          const resp = await ventasApi.getVentaTienePagos(v.id);
          if (resp && resp.tiene_pagos) {
            alert(resp.motivo || 'No se puede eliminar: la venta tiene pagos realizados.');
            return;
          }
        } catch (err) {
          // Si falla la consulta, continuar con la comprobación local
          console.warn('No se pudo comprobar pagos en backend antes de eliminar, se usará verificación local', err);
        }
      }

      if (!confirm(`¿Eliminar venta #${v.id} (folio: ${v.folioVenta || '-'})? Esta acción no se puede deshacer.`)) return;

      await ventasApi.deleteVenta(v.id);
      setVentas(prev => prev.filter(x => x.id !== v.id));
    } catch (err) {
      console.error('Error eliminando venta', err);
      // Manejar caso de bloqueo en backend (409)
      if (err && (err.status === 409 || err.body?.code === 'VENTA_CREDITO_CON_PAGOS')) {
        const msg = (err.body && err.body.message) ? err.body.message : 'No se puede eliminar: la venta tiene pagos registrados.';
        alert(msg);
        return;
      }
      alert('Error eliminando la venta');
    }
  };

  const ventaCreditoConPagos = (v) => {
    try {
      const mp = String(v?.metodos_pago ?? '').toLowerCase().trim();
      if (mp !== 'credito (deuda)') return false;
      const pagado = Number(
        v?.monto_pagado ??
        v?.montoPagado ??
        v?.pagado ??
        v?.total_pagado ??
        v?.abonado ??
        v?.abono ??
        0
      ) || 0;
      return pagado > 0;
    } catch {
      return false;
    }
  };

  const handleEditClick = async (v) => {
    // Primero preguntar al backend si la venta (Crédito/Deuda) tiene pagos registrados
    try {
      if (String(v?.metodos_pago ?? '').toLowerCase().trim() === 'credito (deuda)') {
        const resp = await ventasApi.getVentaTienePagos(v.id);
        if (resp && resp.tiene_pagos) {
          alert(resp.motivo || 'No se puede editar: la venta tiene pagos realizados.');
          return;
        }
      }
    } catch (err) {
      // Si falla la consulta, no bloquear por defecto; mostrar aviso y permitir seguir con la verificación local
      console.warn('No se pudo comprobar pagos en backend, se usará verificación local', err);
    }

    // fallback local y carga de cliente antes de abrir modal para que NuevaVenta lo muestre
    try {
      let ventaConCliente = { ...v };
      const clienteId = v.cliente_id ?? v.cliente ?? null;
      if (clienteId) {
        try {
          const cli = await fetchClienteByRut(String(clienteId));
          if (cli) ventaConCliente.cliente = cli;
        } catch (e) {
          console.warn('No se pudo obtener cliente al editar venta:', e.message || e);
        }
      }
      // última comprobación local por si existe campo pagado en la fila
      if (ventaCreditoConPagos(ventaConCliente)) {
        alert('No se puede editar una venta a Crédito (Deuda) que ya tiene pagos registrados.');
        return;
      }
      setVentaEnEdicion(ventaConCliente);
    } catch (err) {
      console.error('Error preparando venta para edición', err);
      setVentaEnEdicion(v);
    }
  };

  const handleSaveEdicion = async (payload) => {
    if (!ventaEnEdicion) return;
    try {
      const updated = await ventasApi.updateVenta(ventaEnEdicion.id, payload);
      // actualizar en lista local
      setVentas(prev => prev.map(x => (x.id === updated.id ? (updated || { ...x, ...payload }) : x)));
      setVentaEnEdicion(null);
    } catch (err) {
      console.error('Error actualizando venta', err);
      if (err && (err.status === 409 || err.body?.code === 'VENTA_CREDITO_CON_PAGOS')) {
        const msg = (err.body && err.body.message) ? err.body.message : 'No se puede editar: la venta tiene pagos registrados.';
        alert(msg);
        return;
      }
      alert('Error al guardar cambios de la venta');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-secondary me-3" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <h2 className="d-inline">Ventas del día {normFecha(fecha)}</h2>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-success" onClick={handleExport} disabled={ventas.length === 0}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Descargar Excel
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Ventas</h5>
        </div>
        <div className="card-body">
          {loading && <div>Cargando ventas...</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && (
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>ID</th>
                    <th>Sucursal</th>
                    <th>Documento</th>
                    <th>Folio</th>
                    <th>Efectivo</th>
                    <th>Transferencia</th>
                    <th>T. Crédito</th>
                    <th>T. Débito</th>
                    <th>Cheque</th>
                    <th>Pago Online</th>
                    <th>Venta a Crédito</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.length === 0 && (
                    <tr><td colSpan="14">No hay ventas para esta fecha.</td></tr>
                  )}
                  {ventas.map(v => {
                    // calcular por-venta usando la misma lógica simplificada
                    const total = Number(v.total) || 0;
                    let pagos = null;
                    if (v.metodos_pago) {
                      if (typeof v.metodos_pago === 'string') {
                        try { pagos = JSON.parse(v.metodos_pago); } catch (e) { pagos = v.metodos_pago; }
                      } else { pagos = v.metodos_pago; }
                    }

                    const amounts = { efectivo: 0, transferencia: 0, tCredito: 0, tDebito: 0, cheque: 0, online: 0, creditoDeuda: 0, otros: 0 };
                    if (Array.isArray(pagos)) {
                      pagos.forEach(p => {
                        const tipo = (p.tipo || p.metodo || '').toString().toLowerCase();
                        const monto = Number(p.monto || p.valor || 0) || 0;
                        if (tipo.includes('efect')) amounts.efectivo += monto;
                        else if (tipo.includes('transfer')) amounts.transferencia += monto;
                        else if (tipo.includes('credito')) amounts.tCredito += monto;
                        else if (tipo.includes('debito')) amounts.tDebito += monto;
                        else if (tipo.includes('cheque')) amounts.cheque += monto;
                        else if (tipo.includes('online')) amounts.online += monto;
                        else if (tipo.includes('deuda')) amounts.creditoDeuda += monto;
                        else amounts.otros += monto;
                      });
                    } else if (typeof pagos === 'object' && pagos !== null) {
                      const tipo = (pagos.tipo || '').toString().toLowerCase();
                      const monto = Number(pagos.monto || pagos.valor || total) || total;
                      if (tipo.includes('efect')) amounts.efectivo += monto;
                      else if (tipo.includes('transfer')) amounts.transferencia += monto;
                      else if (tipo.includes('credito')) amounts.tCredito += monto;
                      else if (tipo.includes('debito')) amounts.tDebito += monto;
                      else if (tipo.includes('cheque')) amounts.cheque += monto;
                      else if (tipo.includes('online')) amounts.online += monto;
                      else if (tipo.includes('deuda')) amounts.creditoDeuda += monto;
                      else amounts.otros += monto;
                    } else if (typeof pagos === 'string') {
                      const tipo = pagos.toLowerCase();
                      if (tipo.includes('efect')) amounts.efectivo += total;
                      else if (tipo.includes('transfer')) amounts.transferencia += total;
                      else if (tipo.includes('credito')) amounts.tCredito += total;
                      else if (tipo.includes('debito')) amounts.tDebito += total;
                      else if (tipo.includes('cheque')) amounts.cheque += total;
                      else if (tipo.includes('online')) amounts.online += total;
                      else if (tipo.includes('deuda')) amounts.creditoDeuda += total;
                      else amounts.otros += total;
                    } else {
                      amounts.otros += total;
                    }

                    const disableEdit = ventaCreditoConPagos(v);

                    return (
                      <tr key={v.id}>
                        <td>{(v.fecha || '').slice(0,10)}</td>
                        <td>{v.id}</td>
                        <td>{v.sucursal_nombre || (v.sucursal?.nombre ?? '')}</td>
                        <td>{v.documentoVenta || ''}</td>
                        <td>{v.folioVenta || ''}</td>
                        <td>{formatMoney(amounts.efectivo)}</td>
                        <td>{formatMoney(amounts.transferencia)}</td>
                        <td>{formatMoney(amounts.tCredito)}</td>
                        <td>{formatMoney(amounts.tDebito)}</td>
                        <td>{formatMoney(amounts.cheque)}</td>
                        <td>{formatMoney(amounts.online)}</td>
                        <td>{formatMoney(amounts.creditoDeuda)}</td>
                        <td>{formatMoney(total)}</td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-sm btn-primary" onClick={() => setSelectedVenta(v)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEditClick(v)}
                              title={disableEdit ? 'No editable: ya tiene pagos en Cuentas por Pagar' : 'Editar'}
                              disabled={disableEdit}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(v)}
                              title={disableEdit ? 'No se puede eliminar: la venta tiene pagos realizados' : 'Eliminar'}
                              disabled={disableEdit}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-light">
                  <tr className="fw-bold">
                    <td colSpan="5">TOTAL DEL DÍA</td>
                    <td>{formatMoney(totales.efectivo)}</td>
                    <td>{formatMoney(totales.transferencia)}</td>
                    <td>{formatMoney(totales.tCredito)}</td>
                    <td>{formatMoney(totales.tDebito)}</td>
                    <td>{formatMoney(totales.cheque)}</td>
                    <td>{formatMoney(totales.online)}</td>
                    <td>{formatMoney(totales.creditoDeuda)}</td>
                    <td>{formatMoney(totales.totalVenta)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedVenta && (
        <DetalleVenta venta={selectedVenta} onClose={() => setSelectedVenta(null)} />
      )}

      {ventaEnEdicion && (
        <NuevaVenta
          onClose={() => setVentaEnEdicion(null)}
          onSave={handleSaveEdicion}
          initialData={ventaEnEdicion}
        />
      )}
    </div>
  );
}

export default VentasDiarias;