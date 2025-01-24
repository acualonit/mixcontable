import React, { useState, useEffect } from 'react';
import { REGIONES, getComunasByRegion } from '../../utils/regiones';

function NuevoEmpleado({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    // Datos Personales
    nombreCompleto: '',
    tipoDocumento: 'rut',
    numeroDocumento: '',
    region: '',
    comuna: '',
    direccion: '',
    ciudad: '',
    correo: '',
    telefono: '',
    celular: '',
    contactoEmergencia: '',
    celularEmergencia: '',
    fechaIngresoLaboral: new Date().toISOString().split('T')[0],
    sucursal: '',

    // Datos Laborales
    cargo: '',
    salarioLiquidoReal: '',
    metodoPago: 'efectivo',
    datosBancarios: {
      nombre: '',
      rut: '',
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      correo: ''
    },

    // Datos para Liquidación
    fechaInicioContrato: '',
    tipoContrato: '',
    fechaVencimientoContrato: '',
    salarioBruto: '',
    gratificacion: '',
    entidadSalud: 'Fonasa',
    nombreIsapre: '',
    tipoCotizacion: 'Pesos',
    valorCotizacion: '',

    // Estado
    estado: 'Activo-Laborando'
  });

  const [comunasDisponibles, setComunasDisponibles] = useState([]);
  const [mostrarDatosBancarios, setMostrarDatosBancarios] = useState(false);
  const [mostrarIsapre, setMostrarIsapre] = useState(false);

  useEffect(() => {
    if (formData.region) {
      setComunasDisponibles(getComunasByRegion(parseInt(formData.region)));
    }
  }, [formData.region]);

  useEffect(() => {
    setMostrarDatosBancarios(formData.metodoPago === 'transferencia');
  }, [formData.metodoPago]);

  useEffect(() => {
    setMostrarIsapre(formData.entidadSalud === 'Isapre');
    if (formData.entidadSalud === 'Fonasa') {
      setFormData(prev => ({
        ...prev,
        valorCotizacion: '7',
        nombreIsapre: '',
        tipoCotizacion: 'Pesos'
      }));
    }
  }, [formData.entidadSalud]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Nuevo Empleado</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Datos Personales */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">Datos Personales</h6>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre Completo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombreCompleto}
                        onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Tipo Documento</label>
                      <select
                        className="form-select"
                        value={formData.tipoDocumento}
                        onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value})}
                        required
                      >
                        <option value="rut">RUT</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="rut_provisorio">RUT Provisorio</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">N° Documento</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.numeroDocumento}
                        onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Región</label>
                      <select
                        className="form-select"
                        value={formData.region}
                        onChange={(e) => {
                          const regionId = e.target.value;
                          setFormData({
                            ...formData,
                            region: regionId,
                            comuna: ''
                          });
                          setComunasDisponibles(regionId ? getComunasByRegion(parseInt(regionId)) : []);
                        }}
                        required
                      >
                        <option value="">Seleccionar región</option>
                        {REGIONES.map(region => (
                          <option key={region.id} value={region.id}>
                            {region.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Comuna</label>
                      <select
                        className="form-select"
                        value={formData.comuna}
                        onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                        required
                        disabled={!formData.region}
                      >
                        <option value="">Seleccionar comuna</option>
                        {comunasDisponibles.map(comuna => (
                          <option key={comuna} value={comuna}>
                            {comuna}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Ciudad</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.ciudad}
                        onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Dirección</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      required
                    />
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Correo</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.correo}
                        onChange={(e) => setFormData({...formData, correo: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Celular</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.celular}
                        onChange={(e) => setFormData({...formData, celular: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Contacto de Emergencia</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.contactoEmergencia}
                        onChange={(e) => setFormData({...formData, contactoEmergencia: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Celular Emergencia</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.celularEmergencia}
                        onChange={(e) => setFormData({...formData, celularEmergencia: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Fecha de Ingreso Laboral</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fechaIngresoLaboral}
                        onChange={(e) => setFormData({...formData, fechaIngresoLaboral: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Sucursal</label>
                      <select
                        className="form-select"
                        value={formData.sucursal}
                        onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar sucursal</option>
                        <option value="Central">Sucursal Central</option>
                        <option value="Norte">Sucursal Norte</option>
                        <option value="Sur">Sucursal Sur</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos Laborales */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">Datos Laborales</h6>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Cargo</label>
                      <select
                        className="form-select"
                        value={formData.cargo}
                        onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar cargo</option>
                        <option value="Gerente">Gerente</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Vendedor">Vendedor</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Operario">Operario</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Analista">Analista</option>
                        <option value="Auxiliar">Auxiliar</option>
                        <option value="Contador">Contador</option>
                        <option value="Secretaria">Secretaria</option>
                        <option value="Recepcionista">Recepcionista</option>
                        <option value="Chofer">Chofer</option>
                        <option value="Bodeguero">Bodeguero</option>
                        <option value="Cajero">Cajero</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Salario Líquido Real</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.salarioLiquidoReal}
                        onChange={(e) => setFormData({...formData, salarioLiquidoReal: e.target.value})}
                        required
                      />
                      <small className="text-muted">
                        Este salario es para control interno y no afecta cálculos legales
                      </small>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Método de Pago</label>
                      <select
                        className="form-select"
                        value={formData.metodoPago}
                        onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                        required
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {mostrarDatosBancarios && (
                    <div className="border rounded p-3 mb-3">
                      <h6 className="mb-3">Datos Bancarios</h6>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label">Nombre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.datosBancarios.nombre}
                            onChange={(e) => setFormData({
                              ...formData,
                              datosBancarios: {...formData.datosBancarios, nombre: e.target.value}
                            })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">RUT</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.datosBancarios.rut}
                            onChange={(e) => setFormData({
                              ...formData,
                              datosBancarios: {...formData.datosBancarios, rut: e.target.value}
                            })}
                            required
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <label className="form-label">Banco</label>
                          <select
                            className="form-select"
                            value={formData.datosBancarios.banco}
                            onChange={(e) => setFormData({
                              ...formData,
                              datosBancarios: {...formData.datosBancarios, banco: e.target.value}
                            })}
                            required
                          >
                            <option value="">Seleccionar banco</option>
                            <option value="banco_estado">Banco Estado</option>
                            <option value="banco_chile">Banco de Chile</option>
                            <option value="banco_santander">Banco Santander</option>
                            <option value="banco_bci">Banco BCI</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Tipo de Cuenta</label>
                          <select
                            className="form-select"
                            value={formData.datosBancarios.tipoCuenta}
                            onChange={(e) => setFormData({
                              ...formData,
                              datosBancarios: {...formData.datosBancarios, tipoCuenta: e.target.value}
                            })}
                            required
                          >
                            <option value="">Seleccionar tipo</option>
                            <option value="corriente">Cuenta Corriente</option>
                            <option value="vista">Cuenta Vista</option>
                            <option value="ahorro">Cuenta de Ahorro</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Número de Cuenta</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.datosBancarios.numeroCuenta}
                            onChange={(e) => setFormData({
                              ...formData,
                              datosBancarios: {...formData.datosBancarios, numeroCuenta: e.target.value}
                            })}
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Correo</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.datosBancarios.correo}
                          onChange={(e) => setFormData({
                            ...formData,
                            datosBancarios: {...formData.datosBancarios, correo: e.target.value}
                          })}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos para Liquidación */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">Datos para Liquidación de Salario y Cotizaciones Sociales</h6>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Fecha de Inicio Contrato</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fechaInicioContrato}
                        onChange={(e) => setFormData({...formData, fechaInicioContrato: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tipo de Contrato</label>
                      <select
                        className="form-select"
                        value={formData.tipoContrato}
                        onChange={(e) => setFormData({...formData, tipoContrato: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="1_mes">A Plazo 1 Mes</option>
                        <option value="3_meses">A Plazo 3 Meses</option>
                        <option value="6_meses">A Plazo 6 Meses</option>
                        <option value="9_meses">A Plazo 9 Meses</option>
                        <option value="12_meses">A Plazo 12 Meses</option>
                        <option value="2_anos">A Plazo 2 Años</option>
                        <option value="indefinido">Indefinido</option>
                        <option value="honorarios">Boleta de Honorario</option>
                        <option value="sin_contrato">Sin Contrato</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fechaVencimientoContrato}
                        onChange={(e) => setFormData({...formData, fechaVencimientoContrato: e.target.value})}
                        disabled={formData.tipoContrato === 'indefinido' || formData.tipoContrato === 'sin_contrato'}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Salario Bruto</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.salarioBruto}
                        onChange={(e) => setFormData({...formData, salarioBruto: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gratificación</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.gratificacion}
                        onChange={(e) => setFormData({...formData, gratificacion: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Entidad de Salud</label>
                      <select
                        className="form-select"
                        value={formData.entidadSalud}
                        onChange={(e) => setFormData({...formData, entidadSalud: e.target.value})}
                        required
                      >
                        <option value="Fonasa">Fonasa</option>
                        <option value="Isapre">Isapre</option>
                      </select>
                    </div>
                    {mostrarIsapre && (
                      <>
                        <div className="col-md-4">
                          <label className="form-label">Nombre Isapre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.nombreIsapre}
                            onChange={(e) => setFormData({...formData, nombreIsapre: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Tipo Cotización</label>
                          <select
                            className="form-select"
                            value={formData.tipoCotizacion}
                            onChange={(e) => setFormData({...formData, tipoCotizacion: e.target.value})}
                            required
                          >
                            <option value="Pesos">Pesos</option>
                            <option value="UF">UF</option>
                          </select>
                        </div>
                      </>
                    )}
                    <div className="col-md-4">
                      <label className="form-label">Valor Cotización</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.valorCotizacion}
                        onChange={(e) => setFormData({...formData, valorCotizacion: e.target.value})}
                        required
                        disabled={formData.entidadSalud === 'Fonasa'}
                      />
                      {formData.entidadSalud === 'Fonasa' && (
                        <small className="text-muted">7% por defecto</small>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado del Empleado */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">Estado del Empleado</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      required
                    >
                      <option value="Activo-Laborando">Activo-Laborando</option>
                      <option value="Renuncio">Renunció</option>
                      <option value="Despedido">Despedido</option>
                      <option value="Activo-Licencia">Activo-Licencia Médica</option>
                      <option value="Activo-Licencia-NR">Activo-Licencia No Remunerada</option>
                      <option value="Activo-Vacaciones">Activo-Vacaciones</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevoEmpleado;