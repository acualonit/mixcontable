-- Esquema inicial de base de datos para mixcontable
-- Compatible con MySQL 8.x

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS mixcontable
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mixcontable;

/* =====================================================
   TABLAS DE SEGURIDAD Y CONFIGURACION
   ===================================================== */

-- Tabla: usuarios (para inicio de sesión)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(150) NULL,
  rol ENUM('ADMIN','CONTADOR','AUXILIAR','INVITADO') NOT NULL DEFAULT 'AUXILIAR',
  esta_activo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla: configuracion_general (parametros de la empresa / sistema)
CREATE TABLE IF NOT EXISTS configuracion_general (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_empresa VARCHAR(200) NOT NULL,
  rut_empresa VARCHAR(50) NULL,
  giro VARCHAR(200) NULL,
  direccion VARCHAR(255) NULL,
  ciudad VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  pais VARCHAR(100) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  moneda_principal VARCHAR(10) NOT NULL DEFAULT 'CLP',
  rut_representante VARCHAR(50) NULL,
  nombre_representante VARCHAR(200) NULL,
  logo_url VARCHAR(255) NULL,
  -- Control de numeración de documentos
  folio_boleta_inicio INT UNSIGNED NULL,
  folio_boleta_actual INT UNSIGNED NULL,
  folio_factura_inicio INT UNSIGNED NULL,
  folio_factura_actual INT UNSIGNED NULL,
  -- Otros parámetros
  permite_ventas_negativas TINYINT(1) NOT NULL DEFAULT 0,
  permite_stock_negativo TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


/* =====================================================
   TABLAS MAESTRAS BASICAS
   ===================================================== */

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  ciudad VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  pais VARCHAR(100) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_clientes_documento (documento, tipo_documento)
) ENGINE=InnoDB;

-- Tabla: proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  ciudad VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  pais VARCHAR(100) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_proveedores_documento (documento, tipo_documento)
) ENGINE=InnoDB;

-- Tabla: personal (empleados)
CREATE TABLE IF NOT EXISTS personal (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(150) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  cargo VARCHAR(100) NULL,
  fecha_ingreso DATE NULL,
  fecha_salida DATE NULL,
  salario_base DECIMAL(18,2) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_personal_documento (documento, tipo_documento)
) ENGINE=InnoDB;


/* =====================================================
   TABLAS DE BANCO Y EFECTIVO
   ===================================================== */

-- Tabla: cuentas_bancarias
CREATE TABLE IF NOT EXISTS cuentas_bancarias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  banco VARCHAR(150) NOT NULL,
  numero_cuenta VARCHAR(50) NOT NULL,
  tipo_cuenta VARCHAR(50) NOT NULL,
  moneda VARCHAR(10) NOT NULL DEFAULT 'CLP',
  saldo_inicial DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cuenta_bancaria (banco, numero_cuenta)
) ENGINE=InnoDB;

-- Tabla: movimientos_banco
CREATE TABLE IF NOT EXISTS movimientos_banco (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuenta_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  tipo_movimiento ENUM('DEBITO','CREDITO') NOT NULL,
  monto DECIMAL(18,2) NOT NULL,
  descripcion VARCHAR(255) NULL,
  referencia VARCHAR(100) NULL,
  origen VARCHAR(50) NULL, -- por ejemplo: VENTA, COMPRA, PAGO_NOMINA, ETC.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_cuenta
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_bancarias(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabla: caja_efectivo
CREATE TABLE IF NOT EXISTS caja_efectivo (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL,
  saldo_inicial DECIMAL(18,2) NOT NULL DEFAULT 0,
  moneda VARCHAR(10) NOT NULL DEFAULT 'CLP',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla: movimientos_caja
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  caja_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  tipo_movimiento ENUM('EGRESO','INGRESO') NOT NULL,
  monto DECIMAL(18,2) NOT NULL,
  descripcion VARCHAR(255) NULL,
  origen VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_caja
    FOREIGN KEY (caja_id) REFERENCES caja_efectivo(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;


/* =====================================================
   TABLAS DE CHEQUES
   ===================================================== */

-- Tabla: cheques
CREATE TABLE IF NOT EXISTS cheques (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuenta_id INT UNSIGNED NOT NULL,
  numero_cheque VARCHAR(50) NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_cobro DATE NULL,
  beneficiario VARCHAR(150) NOT NULL,
  monto DECIMAL(18,2) NOT NULL,
  estado ENUM('EMITIDO','COBRADO','ANULADO','RECHAZADO') NOT NULL DEFAULT 'EMITIDO',
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cheque_numero (cuenta_id, numero_cheque),
  CONSTRAINT fk_cheques_cuenta
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_bancarias(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;


/* =====================================================
   TABLAS DE ACTIVOS FIJOS
   ===================================================== */

-- Tabla: activos_fijos
CREATE TABLE IF NOT EXISTS activos_fijos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NULL,
  fecha_compra DATE NULL,
  costo_adquisicion DECIMAL(18,2) NULL,
  vida_util_meses INT UNSIGNED NULL,
  valor_residual DECIMAL(18,2) NULL,
  ubicacion VARCHAR(150) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_activos_codigo (codigo)
) ENGINE=InnoDB;

-- Tabla: mantenimientos_activo
CREATE TABLE IF NOT EXISTS mantenimientos_activo (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activo_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  tipo VARCHAR(100) NULL,
  proveedor_id INT UNSIGNED NULL,
  costo DECIMAL(18,2) NOT NULL DEFAULT 0,
  descripcion VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mantenimiento_activo
    FOREIGN KEY (activo_id) REFERENCES activos_fijos(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_mantenimiento_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;


/* =====================================================
   TABLAS DE VENTAS Y CUENTAS POR COBRAR
   ===================================================== */

-- Tabla: ventas
CREATE TABLE IF NOT EXISTS ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NULL,
  fecha DATE NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL, -- FACTURA, BOLETA, etc.
  folio VARCHAR(50) NULL,
  total_neto DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_impuesto DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_bruto DECIMAL(18,2) NOT NULL DEFAULT 0,
  estado ENUM('EMITIDA','ANULADA','ELIMINADA') NOT NULL DEFAULT 'EMITIDA',
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla: ventas_detalle
CREATE TABLE IF NOT EXISTS ventas_detalle (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id INT UNSIGNED NOT NULL,
  descripcion_item VARCHAR(255) NOT NULL,
  cantidad DECIMAL(18,4) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(18,4) NOT NULL DEFAULT 0,
  descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0,
  impuesto_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_linea DECIMAL(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_ventas_detalle_venta
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla: cuentas_cobrar
CREATE TABLE IF NOT EXISTS cuentas_cobrar (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  venta_id INT UNSIGNED NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  monto_total DECIMAL(18,2) NOT NULL,
  saldo_pendiente DECIMAL(18,2) NOT NULL,
  estado ENUM('PENDIENTE','PAGADA','VENCIDA','ELIMINADA') NOT NULL DEFAULT 'PENDIENTE',
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cxc_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_cxc_venta
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla: pagos_cuentas_cobrar
CREATE TABLE IF NOT EXISTS pagos_cuentas_cobrar (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuenta_cobrar_id INT UNSIGNED NOT NULL,
  fecha_pago DATE NOT NULL,
  monto_pagado DECIMAL(18,2) NOT NULL,
  metodo_pago VARCHAR(50) NULL,
  referencia VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagos_cxc
    FOREIGN KEY (cuenta_cobrar_id) REFERENCES cuentas_cobrar(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;


/* =====================================================
   TABLAS DE COMPRAS, GASTOS Y CUENTAS POR PAGAR
   ===================================================== */

-- Tabla: compras
CREATE TABLE IF NOT EXISTS compras (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT UNSIGNED NULL,
  fecha DATE NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL,
  folio VARCHAR(50) NULL,
  total_neto DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_impuesto DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_bruto DECIMAL(18,2) NOT NULL DEFAULT 0,
  estado ENUM('REGISTRADA','ANULADA','ELIMINADA') NOT NULL DEFAULT 'REGISTRADA',
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_compras_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla: compras_detalle
CREATE TABLE IF NOT EXISTS compras_detalle (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  compra_id INT UNSIGNED NOT NULL,
  descripcion_item VARCHAR(255) NOT NULL,
  cantidad DECIMAL(18,4) NOT NULL DEFAULT 1,
  costo_unitario DECIMAL(18,4) NOT NULL DEFAULT 0,
  descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0,
  impuesto_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_linea DECIMAL(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_compras_detalle_compra
    FOREIGN KEY (compra_id) REFERENCES compras(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla: gastos
CREATE TABLE IF NOT EXISTS gastos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT UNSIGNED NULL,
  fecha DATE NOT NULL,
  categoria VARCHAR(100) NULL,
  descripcion VARCHAR(255) NOT NULL,
  monto DECIMAL(18,2) NOT NULL,
  es_recurrente TINYINT(1) NOT NULL DEFAULT 0,
  estado ENUM('REGISTRADO','ELIMINADO') NOT NULL DEFAULT 'REGISTRADO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_gastos_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla: cuentas_pagar
CREATE TABLE IF NOT EXISTS cuentas_pagar (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT UNSIGNED NOT NULL,
  compra_id INT UNSIGNED NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  monto_total DECIMAL(18,2) NOT NULL,
  saldo_pendiente DECIMAL(18,2) NOT NULL,
  estado ENUM('PENDIENTE','PAGADA','VENCIDA','ELIMINADA') NOT NULL DEFAULT 'PENDIENTE',
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cxp_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_cxp_compra
    FOREIGN KEY (compra_id) REFERENCES compras(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla: pagos_cuentas_pagar
CREATE TABLE IF NOT EXISTS pagos_cuentas_pagar (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuenta_pagar_id INT UNSIGNED NOT NULL,
  fecha_pago DATE NOT NULL,
  monto_pagado DECIMAL(18,2) NOT NULL,
  metodo_pago VARCHAR(50) NULL,
  referencia VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagos_cxp
    FOREIGN KEY (cuenta_pagar_id) REFERENCES cuentas_pagar(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;


/* =====================================================
   TABLAS DE NOMINA
   ===================================================== */

-- Tabla: nomina (cabecera de liquidación)
CREATE TABLE IF NOT EXISTS nomina (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  periodo VARCHAR(20) NOT NULL, -- por ejemplo: 2025-11
  fecha_proceso DATE NOT NULL,
  descripcion VARCHAR(255) NULL,
  estado ENUM('GENERADA','PAGADA','ANULADA') NOT NULL DEFAULT 'GENERADA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla: nomina_detalle (por trabajador)
CREATE TABLE IF NOT EXISTS nomina_detalle (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nomina_id INT UNSIGNED NOT NULL,
  personal_id INT UNSIGNED NOT NULL,
  sueldo_base DECIMAL(18,2) NOT NULL DEFAULT 0,
  horas_extras DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_horas_extras DECIMAL(18,2) NOT NULL DEFAULT 0,
  bonos DECIMAL(18,2) NOT NULL DEFAULT 0,
  descuentos DECIMAL(18,2) NOT NULL DEFAULT 0,
  imponible DECIMAL(18,2) NOT NULL DEFAULT 0,
  liquido_pagar DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_nomina_detalle_nomina
    FOREIGN KEY (nomina_id) REFERENCES nomina(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_nomina_detalle_personal
    FOREIGN KEY (personal_id) REFERENCES personal(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;


/* =====================================================
   TABLAS DE OTROS INGRESOS / EGRESOS
   ===================================================== */

-- Tabla: otros_ingresos
CREATE TABLE IF NOT EXISTS otros_ingresos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  categoria VARCHAR(100) NULL,
  descripcion VARCHAR(255) NOT NULL,
  monto DECIMAL(18,2) NOT NULL,
  origen VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla: otros_egresos
CREATE TABLE IF NOT EXISTS otros_egresos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  categoria VARCHAR(100) NULL,
  descripcion VARCHAR(255) NOT NULL,
  monto DECIMAL(18,2) NOT NULL,
  destino VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


/* =====================================================
   TABLA PARA REGISTROS ELIMINADOS (AUDITORIA SIMPLE)
   ===================================================== */

-- Tabla: registros_eliminados (para módulo Eliminar)
CREATE TABLE IF NOT EXISTS registros_eliminados (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tabla VARCHAR(100) NOT NULL,
  registro_id INT UNSIGNED NOT NULL,
  datos_json JSON NULL,
  eliminado_por INT UNSIGNED NULL,
  motivo VARCHAR(255) NULL,
  eliminado_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registros_eliminados_usuario
    FOREIGN KEY (eliminado_por) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;
