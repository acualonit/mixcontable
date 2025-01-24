import React, { useState } from 'react';
import NuevaNomina from '../components/nomina/NuevaNomina';
import DetalleNomina from '../components/nomina/DetalleNomina';
import EditarNomina from '../components/nomina/EditarNomina';
import LibroRemuneraciones from '../components/nomina/LibroRemuneraciones';
import LibroPagoComprobante from '../components/nomina/LibroPagoComprobante';
import ConfiguracionPago from '../components/nomina/ConfiguracionPago';
import PersonalPorPagar from '../components/nomina/PersonalPorPagar';
import HistorialPagos from '../components/nomina/HistorialPagos';

function Nomina() {
  const [showNuevaNomina, setShowNuevaNomina] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showLibroRemuneraciones, setShowLibroRemuneraciones] = useState(false);
  const [showLibroPagoComprobante, setShowLibroPagoComprobante] = useState(false);
  const [showConfiguracionPago, setShowConfiguracionPago] = useState(false);
  const [showHistorialPagos, setShowHistorialPagos] = useState(false);
  const [nominaSeleccionada, setNominaSeleccionada] = useState(null);
  const [tipoNomina, setTipoNomina] = useState('');
  const [periodo, setPeriodo] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleNuevaNomina = (tipo) => {
    if (tipo === 'liquidacion') {
      setShowLibroRemuneraciones(true);
    } else if (tipo === 'comprobante') {
      setShowLibroPagoComprobante(true);
    } else {
      setTipoNomina(tipo);
      setShowNuevaNomina(true);
    }
  };

  if (showLibroRemuneraciones) {
    return <LibroRemuneraciones onBack={() => setShowLibroRemuneraciones(false)} />;
  }

  if (showLibroPagoComprobante) {
    return <LibroPagoComprobante onBack={() => setShowLibroPagoComprobante(false)} />;
  }

  if (showConfiguracionPago) {
    return <ConfiguracionPago onBack={() => setShowConfiguracionPago(false)} />;
  }

  if (showHistorialPagos) {
    return <HistorialPagos onBack={() => setShowHistorialPagos(false)} />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Nómina</h2>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button 
              className="btn btn-success"
              onClick={() => handleNuevaNomina('liquidacion')}
            >
              <i className="bi bi-file-text me-2"></i>
              Nómina con Imponible
            </button>
            <button 
              className="btn btn-warning"
              onClick={() => handleNuevaNomina('comprobante')}
            >
              <i className="bi bi-receipt me-2"></i>
              Nómina con Comprobante
            </button>
            <button 
              className="btn btn-info"
              onClick={() => setShowConfiguracionPago(true)}
            >
              <i className="bi bi-gear me-2"></i>
              Configuración de Pago
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowHistorialPagos(true)}
            >
              <i className="bi bi-clock-history me-2"></i>
              Historial de Personal Pagado
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Personal por Pagar */}
      <PersonalPorPagar />

      {/* Modales */}
      {showNuevaNomina && (
        <NuevaNomina 
          onClose={() => {
            setShowNuevaNomina(false);
            setTipoNomina('');
          }}
          onSave={(nomina) => {
            console.log('Nueva nómina:', nomina);
            setShowNuevaNomina(false);
            setTipoNomina('');
          }}
          periodo={periodo}
          tipo={tipoNomina}
        />
      )}

      {showDetalle && nominaSeleccionada && (
        <DetalleNomina 
          nomina={nominaSeleccionada}
          onClose={() => {
            setShowDetalle(false);
            setNominaSeleccionada(null);
          }}
        />
      )}

      {showEditar && nominaSeleccionada && (
        <EditarNomina
          nomina={nominaSeleccionada}
          onClose={() => {
            setShowEditar(false);
            setNominaSeleccionada(null);
          }}
          onSave={(nominaEditada) => {
            console.log('Nómina editada:', nominaEditada);
            setShowEditar(false);
            setNominaSeleccionada(null);
          }}
        />
      )}
    </div>
  );
}

export default Nomina;