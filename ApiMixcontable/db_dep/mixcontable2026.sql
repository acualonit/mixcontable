/*
Navicat MariaDB Data Transfer

Source Server         : DB Locales
Source Server Version : 100427
Source Host           : localhost:3306
Source Database       : mixcontable

Target Server Type    : MariaDB
Target Server Version : 100427
File Encoding         : 65001

Date: 2026-01-17 20:10:28
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for activos_fijos
-- ----------------------------
DROP TABLE IF EXISTS `activos_fijos`;
CREATE TABLE `activos_fijos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `fecha_compra` date DEFAULT NULL,
  `costo_adquisicion` decimal(18,2) DEFAULT NULL,
  `vida_util_meses` int(10) unsigned DEFAULT NULL,
  `valor_residual` decimal(18,2) DEFAULT NULL,
  `ubicacion` varchar(150) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_activos_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of activos_fijos
-- ----------------------------

-- ----------------------------
-- Table structure for cache
-- ----------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of cache
-- ----------------------------

-- ----------------------------
-- Table structure for cache_locks
-- ----------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of cache_locks
-- ----------------------------

-- ----------------------------
-- Table structure for caja_efectivo
-- ----------------------------
DROP TABLE IF EXISTS `caja_efectivo`;
CREATE TABLE `caja_efectivo` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(150) NOT NULL,
  `saldo_actual` decimal(18,2) NOT NULL DEFAULT 0.00,
  `moneda` varchar(10) NOT NULL DEFAULT 'CLP',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of caja_efectivo
-- ----------------------------
INSERT INTO `caja_efectivo` VALUES ('1', 'Test', '10932.73', 'CLP', '2025-12-11 08:12:24', '2026-01-17 18:27:06', '2026-01-17 13:27:06');

-- ----------------------------
-- Table structure for cheques
-- ----------------------------
DROP TABLE IF EXISTS `cheques`;
CREATE TABLE `cheques` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cuenta_id` int(10) unsigned NOT NULL,
  `numero_cheque` varchar(50) NOT NULL,
  `tipo` enum('Emitidos','Recibidos') DEFAULT 'Emitidos',
  `fecha_emision` date NOT NULL,
  `fecha_cobro` date DEFAULT NULL,
  `beneficiario` varchar(150) NOT NULL,
  `concepto` varchar(255) DEFAULT NULL,
  `monto` decimal(18,2) NOT NULL,
  `estado` enum('Pendiente','Cobrado','Rechazado','Prestado') NOT NULL DEFAULT 'Pendiente',
  `observaciones` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cheque_numero` (`cuenta_id`,`numero_cheque`),
  CONSTRAINT `fk_cheques_cuenta` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_bancarias` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of cheques
-- ----------------------------
INSERT INTO `cheques` VALUES ('3', '4', '12414', 'Emitidos', '2025-12-08', '2025-12-16', 'Test destinatario', 'Concepto  test', '1541.00', 'Cobrado', 'Observacion.', '2025-12-16 15:07:56', '2025-12-16 15:32:21', '2025-12-16 10:32:21');
INSERT INTO `cheques` VALUES ('4', '3', '71154', 'Emitidos', '2025-12-09', '2025-12-13', 'TEST DESTINATARIO', 'CONCEPTO TEST', '41.00', 'Pendiente', 'TEST OBSERVACION', '2025-12-16 15:18:35', '2025-12-16 15:40:04', null);
INSERT INTO `cheques` VALUES ('5', '2', '7411', 'Emitidos', '2025-12-12', '2025-12-15', 'Test destinatario3', 'Concepto s', '541.00', 'Rechazado', 'Observacion s', '2025-12-16 15:22:29', '2025-12-16 15:22:29', null);
INSERT INTO `cheques` VALUES ('6', '4', '1414', 'Emitidos', '2025-12-09', '2025-12-15', 'Test destinatario 4', 'Test 4', '141.00', 'Prestado', 'Observacion 4', '2025-12-16 15:51:32', '2025-12-16 15:51:32', null);

-- ----------------------------
-- Table structure for clientes
-- ----------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rut` varchar(255) DEFAULT NULL,
  `razon_social` varchar(255) NOT NULL,
  `nombre_fantasia` varchar(255) DEFAULT NULL,
  `giro` varchar(255) DEFAULT NULL,
  `ciudad` varchar(255) DEFAULT NULL,
  `comuna` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `contacto_cobranza` varchar(150) DEFAULT NULL,
  `tel_cobranza` varchar(50) DEFAULT NULL,
  `email_cobranza` varchar(150) DEFAULT NULL,
  `limite_credito` decimal(18,2) DEFAULT NULL,
  `observacion` text DEFAULT NULL,
  `contacto_principal` varchar(255) DEFAULT NULL,
  `telefono_principal` varchar(255) DEFAULT NULL,
  `email_principal` varchar(255) DEFAULT NULL,
  `condicion_venta` varchar(255) NOT NULL DEFAULT '0',
  `estado` varchar(255) NOT NULL DEFAULT 'activo',
  `historial_estados` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`historial_estados`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of clientes
-- ----------------------------
INSERT INTO `clientes` VALUES ('1', '12314', 'Test', 'Test fantasia', 'GirTest', 'Maullin  ciudad', 'Maull�n', 'Regi�n de Los Lagos', 'Test cobranza', null, 'clientestestcobranza@gmail.com', '140.00', 'Test Observaciones', 'Test cliente', '3116645844', 'clientestest@gmail.com', '60', 'inactivo', 0x5B7B226665636861223A22323032352D31322D30362031363A31363A3333222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A224372656163695C75303066336E222C22646574616C6C6573223A224372656163695C75303066336E20696E696369616C2064656C20636C69656E7465227D2C7B226665636861223A22323032352D31322D30362031363A33393A3337222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A22496E61637469766163695C75303066336E222C22646574616C6C6573223A22436C69656E746520696E616374697661646F227D2C7B226665636861223A22323032352D31322D31302030323A32313A3537222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A22496E61637469766163695C75303066336E222C22646574616C6C6573223A22436C69656E746520696E616374697661646F227D5D, '2025-12-06 16:16:33', '2025-12-10 02:21:57', null, 'cra 5#  36');
INSERT INTO `clientes` VALUES ('2', '1223', 'Test 2 cliente', 'Fantasia 2', 'Giro 2', 'Test2 ciudad', 'Panguipulli', 'Regi�n de Los R�os', 'Test2Cobranza', '314451154', 'test2cobranza@gmail.com', '11.00', 'Test 2 Observaciones', 'Test 2', '3145821', 'Test2@gmail.com', '45', 'inactivo', 0x5B7B226665636861223A22323032352D31322D30362031373A30353A3531222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A224372656163695C75303066336E222C22646574616C6C6573223A224372656163695C75303066336E20696E696369616C2064656C20636C69656E7465227D2C7B226665636861223A22323032352D31322D30362031373A30363A3236222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A22496E61637469766163695C75303066336E222C22646574616C6C6573223A22436C69656E746520696E616374697661646F227D2C7B226665636861223A22323032352D31322D30362031373A31303A3536222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A22496E61637469766163695C75303066336E222C22646574616C6C6573223A22436C69656E746520696E616374697661646F227D2C7B226665636861223A22323032352D31322D30362031373A32363A3538222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A22496E61637469766163695C75303066336E222C22646574616C6C6573223A22436C69656E746520696E616374697661646F227D5D, '2025-12-06 17:05:51', '2025-12-06 17:26:58', null, 'Cra 5 # 8');
INSERT INTO `clientes` VALUES ('3', '1234567', 'La Barranquillera', 'F.barranquillera', 'Giro/Barranquilla', 'Test pinto', 'Pinto', 'Regi�n de �uble', 'Pedro', '3235464875', 'juancontacto@gmail.com', '149.00', 'Es un cliente fiel.', 'Juan', '3225467884', 'juan@gmail.com', '90', 'activo', 0x5B7B226665636861223A22323032352D31322D31302030323A31393A3137222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A224372656163695C75303066336E222C22646574616C6C6573223A224372656163695C75303066336E20696E696369616C2064656C20636C69656E7465227D5D, '2025-12-10 02:19:17', '2025-12-10 02:19:17', null, 'Cra 6 # 139 -90');
INSERT INTO `clientes` VALUES ('4', '26422451-9', 'inversiones mejor', 'joyeria', 'comercio', 'santiago', 'Santiago', 'Regi�n Metropolitana de Santiago', 'pedro', '900273799', 'pedromejor@gmail.com', '100000.00', 'es una prueba de ver el clientes', 'francisto', '989002737', 'joyasmejor@gmail.com', '30', 'activo', 0x5B7B226665636861223A22323032362D30312D31332031383A33343A3339222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A224372656163695C75303066336E222C22646574616C6C6573223A224372656163695C75303066336E20696E696369616C2064656C20636C69656E7465227D5D, '2026-01-13 18:34:39', '2026-01-13 18:34:39', null, 'monjitas 425');

-- ----------------------------
-- Table structure for compras
-- ----------------------------
DROP TABLE IF EXISTS `compras`;
CREATE TABLE `compras` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `proveedor_id` int(10) unsigned DEFAULT NULL,
  `fecha` date NOT NULL,
  `fecha_final` date DEFAULT NULL,
  `tipo_documento` varchar(20) NOT NULL,
  `folio` varchar(50) DEFAULT NULL,
  `total_neto` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_impuesto` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_bruto` decimal(18,2) NOT NULL DEFAULT 0.00,
  `id_sucursal` bigint(20) unsigned NOT NULL,
  `estado` enum('REGISTRADA','ANULADA','ELIMINADA') NOT NULL DEFAULT 'REGISTRADA',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_by_name` varchar(255) DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by_name` varchar(255) DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by_name` varchar(255) DEFAULT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_compras_proveedor` (`proveedor_id`),
  KEY `fk_compras_sucursales` (`id_sucursal`) USING BTREE,
  CONSTRAINT `proveedores_fk` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `sucursal_fk` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursales` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of compras
-- ----------------------------
INSERT INTO `compras` VALUES ('4', '5', '2026-01-15', '0000-00-00', 'factura_afecta', '1451541', '4202.00', '798.00', '5000.00', '3', 'REGISTRADA', null, null, null, null, null, null, 'Test', '2026-01-15 12:37:59', '2026-01-15 12:55:11', null);
INSERT INTO `compras` VALUES ('5', '4', '2026-01-15', '0000-00-00', 'boleta_honorarios', '64217', '4000.00', '0.00', '4000.00', '1', 'REGISTRADA', null, null, null, null, null, null, 'Observaciones TEST', '2026-01-15 13:00:30', '2026-01-15 08:15:45', null);
INSERT INTO `compras` VALUES ('6', '4', '2026-01-15', '0000-00-00', 'boleta_afecta', '571154', '12941.00', '2459.00', '15400.00', '2', 'REGISTRADA', null, null, null, null, null, null, 'Observaciones 521', '2026-01-15 13:11:41', '2026-01-15 13:12:34', null);
INSERT INTO `compras` VALUES ('7', '4', '2026-01-15', '0000-00-00', 'factura_exenta', '1241', '700.00', '0.00', '700.00', '4', 'REGISTRADA', null, null, '12', 'Super Administrador', null, null, 'test 1', '2026-01-15 13:37:04', '2026-01-15 14:13:49', null);
INSERT INTO `compras` VALUES ('8', '4', '2026-01-15', '0000-00-00', 'factura_afecta', '1241121', '336.00', '64.00', '400.00', '4', 'REGISTRADA', null, null, null, null, null, null, 'Test 10', '2026-01-15 14:14:39', '2026-01-15 14:14:39', null);
INSERT INTO `compras` VALUES ('9', '4', '2026-01-15', '0000-00-00', 'factura_exenta', '56026', '1500.00', '0.00', '1500.00', '5', 'REGISTRADA', '12', 'Super Administrador', '12', 'Super Administrador', '12', 'Super Administrador', 'Obseravcion tes', '2026-01-15 14:19:03', '2026-01-15 14:21:26', '2026-01-15 14:21:26');
INSERT INTO `compras` VALUES ('10', '5', '2026-01-15', '0000-00-00', 'boleta_afecta', '121212', '1261.00', '239.00', '1500.00', '4', 'REGISTRADA', '12', 'Super Administrador', '12', 'Super Administrador', null, null, 'Observacion 2023', '2026-01-15 14:21:02', '2026-01-15 14:42:10', null);
INSERT INTO `compras` VALUES ('11', '5', '2026-01-16', null, 'factura_afecta', '5541', '4202.00', '798.00', '5000.00', '4', 'REGISTRADA', '12', 'Super Administrador', null, null, null, null, 'sadqd', '2026-01-16 02:43:54', '2026-01-16 02:43:54', null);
INSERT INTO `compras` VALUES ('12', '5', '2026-01-16', null, 'factura_exenta', '74', '500.00', '0.00', '500.00', '4', 'REGISTRADA', '12', 'Super Administrador', null, null, null, null, 'sqsa', '2026-01-16 02:50:26', '2026-01-16 02:50:26', null);
INSERT INTO `compras` VALUES ('13', '5', '2026-01-16', null, 'factura_afecta', '5151', '420.00', '80.00', '500.00', '3', 'REGISTRADA', '12', 'Super Administrador', null, null, null, null, 'aq', '2026-01-16 02:53:47', '2026-01-16 02:53:47', null);
INSERT INTO `compras` VALUES ('14', '5', '2026-01-16', '2026-01-14', 'factura_exenta', '515', '150.00', '0.00', '150.00', '4', 'REGISTRADA', '12', 'Super Administrador', null, null, null, null, 'sssa', '2026-01-16 02:57:37', '2026-01-16 02:57:37', null);
INSERT INTO `compras` VALUES ('15', '5', '2026-01-16', null, 'boleta_afecta', '15404', '336.00', '64.00', '400.00', '4', 'REGISTRADA', '12', 'Super Administrador', null, null, null, null, 'sss', '2026-01-16 02:58:12', '2026-01-16 02:58:12', null);

-- ----------------------------
-- Table structure for compras_detalle
-- ----------------------------
DROP TABLE IF EXISTS `compras_detalle`;
CREATE TABLE `compras_detalle` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `compra_id` int(10) unsigned NOT NULL,
  `descripcion_item` varchar(255) NOT NULL,
  `cantidad` decimal(18,4) NOT NULL DEFAULT 1.0000,
  `costo_unitario` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `descuento_porcentaje` decimal(5,2) NOT NULL DEFAULT 0.00,
  `impuesto_porcentaje` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total_linea` decimal(18,2) NOT NULL DEFAULT 0.00,
  `create_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `update_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_compras_detalle_compra` (`compra_id`),
  CONSTRAINT `fk_compras_detalle_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of compras_detalle
-- ----------------------------
INSERT INTO `compras_detalle` VALUES ('4', '4', 'Test 2026', '1.0000', '1000.0000', '0.00', '0.00', '1000.00', '2026-01-15 07:58:50', '2026-01-15 07:58:50', '2026-01-15 12:58:50');
INSERT INTO `compras_detalle` VALUES ('5', '4', 'Test 2026', '1.0000', '5000.0000', '0.00', '0.00', '5000.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('6', '5', 'TEST KJ', '1.0000', '4000.0000', '0.00', '0.00', '4000.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('7', '6', 'Test', '1.0000', '5000.0000', '0.00', '0.00', '5000.00', '2026-01-15 08:12:34', '2026-01-15 08:12:34', '2026-01-15 13:12:34');
INSERT INTO `compras_detalle` VALUES ('8', '6', 'Test', '1.0000', '15400.0000', '0.00', '0.00', '15400.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('9', '7', 'hhagh', '1.0000', '700.0000', '0.00', '0.00', '700.00', '2026-01-15 09:13:49', '2026-01-15 09:13:49', '2026-01-15 14:13:49');
INSERT INTO `compras_detalle` VALUES ('10', '7', 'hhagh', '1.0000', '700.0000', '0.00', '0.00', '700.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('11', '8', 'Test', '1.0000', '400.0000', '0.00', '0.00', '400.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('12', '9', 'Test descrip', '1.0000', '1500.0000', '0.00', '0.00', '1500.00', '2026-01-15 09:19:58', '2026-01-15 09:19:58', '2026-01-15 14:19:58');
INSERT INTO `compras_detalle` VALUES ('13', '9', 'Test descrip', '1.0000', '1500.0000', '0.00', '0.00', '1500.00', '2026-01-15 09:21:26', '2026-01-15 09:21:26', '2026-01-15 14:21:26');
INSERT INTO `compras_detalle` VALUES ('14', '10', 'dsadasd', '1.0000', '1500.0000', '0.00', '0.00', '1500.00', '2026-01-15 09:42:10', '2026-01-15 09:42:10', '2026-01-15 14:42:10');
INSERT INTO `compras_detalle` VALUES ('15', '10', 'dsadasd', '1.0000', '1500.0000', '0.00', '0.00', '1500.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('16', '11', 'sqws', '1.0000', '5000.0000', '0.00', '0.00', '5000.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('17', '12', 'wfedf', '1.0000', '500.0000', '0.00', '0.00', '500.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('18', '13', 'asa', '1.0000', '500.0000', '0.00', '0.00', '500.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('19', '14', 'ssqsww', '1.0000', '150.0000', '0.00', '0.00', '150.00', null, null, null);
INSERT INTO `compras_detalle` VALUES ('20', '15', 'gbvgbsg', '1.0000', '400.0000', '0.00', '0.00', '400.00', null, null, null);

-- ----------------------------
-- Table structure for configuracion_general
-- ----------------------------
DROP TABLE IF EXISTS `configuracion_general`;
CREATE TABLE `configuracion_general` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_empresa` varchar(200) NOT NULL,
  `rut_empresa` varchar(50) DEFAULT NULL,
  `giro` varchar(200) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `moneda_principal` varchar(10) NOT NULL DEFAULT 'CLP',
  `rut_representante` varchar(50) DEFAULT NULL,
  `nombre_representante` varchar(200) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `folio_boleta_inicio` int(10) unsigned DEFAULT NULL,
  `folio_boleta_actual` int(10) unsigned DEFAULT NULL,
  `folio_factura_inicio` int(10) unsigned DEFAULT NULL,
  `folio_factura_actual` int(10) unsigned DEFAULT NULL,
  `permite_ventas_negativas` tinyint(1) NOT NULL DEFAULT 0,
  `permite_stock_negativo` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of configuracion_general
-- ----------------------------

-- ----------------------------
-- Table structure for cuentas_bancarias
-- ----------------------------
DROP TABLE IF EXISTS `cuentas_bancarias`;
CREATE TABLE `cuentas_bancarias` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_sucursal` bigint(20) unsigned NOT NULL,
  `banco` varchar(150) NOT NULL,
  `numero_cuenta` varchar(50) NOT NULL,
  `tipo_cuenta` varchar(50) NOT NULL,
  `moneda` varchar(10) NOT NULL DEFAULT 'CLP',
  `saldo` decimal(18,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cuenta_bancaria` (`banco`,`numero_cuenta`),
  KEY `fk_Cuenta_b.` (`id_sucursal`),
  CONSTRAINT `fk_Cuenta_b.` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of cuentas_bancarias
-- ----------------------------
INSERT INTO `cuentas_bancarias` VALUES ('2', '1', 'banco_estado', '1232121', 'corriente', 'CLP', '145.00', '2025-12-13 15:19:33', '2025-12-13 15:19:33', null);
INSERT INTO `cuentas_bancarias` VALUES ('3', '3', 'banco_santander', '78884', 'corriente', 'CLP', '500.00', '2025-12-13 17:19:52', '2025-12-13 17:19:52', null);
INSERT INTO `cuentas_bancarias` VALUES ('4', '2', 'banco_estado', '888', 'corriente', 'CLP', '-2700.00', '2025-12-13 17:32:26', '2025-12-17 15:56:11', '2025-12-17 10:56:11');
INSERT INTO `cuentas_bancarias` VALUES ('5', '3', 'banco_santander', '105298000', 'vista', 'CLP', '12000.00', '2025-12-16 16:19:16', '2025-12-17 16:05:31', '2025-12-17 11:05:31');
INSERT INTO `cuentas_bancarias` VALUES ('6', '4', 'banco_estado', '54121', 'corriente', 'CLP', '500.00', '2026-01-16 04:11:34', '2026-01-16 04:11:34', null);

-- ----------------------------
-- Table structure for cuentas_cobrar
-- ----------------------------
DROP TABLE IF EXISTS `cuentas_cobrar`;
CREATE TABLE `cuentas_cobrar` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` int(10) unsigned NOT NULL,
  `venta_id` bigint(20) unsigned DEFAULT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `monto_total` decimal(18,2) NOT NULL,
  `saldo_pendiente` decimal(18,2) NOT NULL,
  `estado` enum('PENDIENTE','PAGADA','VENCIDA','ELIMINADA') NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cxc_venta` (`venta_id`),
  KEY `fk_venta_1` (`cliente_id`),
  CONSTRAINT `fk_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_venta_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of cuentas_cobrar
-- ----------------------------

-- ----------------------------
-- Table structure for cuentas_pagar
-- ----------------------------
DROP TABLE IF EXISTS `cuentas_pagar`;
CREATE TABLE `cuentas_pagar` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `proveedor_id` int(10) unsigned NOT NULL,
  `compra_id` int(10) unsigned DEFAULT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `monto_total` decimal(18,2) NOT NULL,
  `saldo_pendiente` decimal(18,2) NOT NULL,
  `estado` enum('PENDIENTE','PAGADA','VENCIDA','ELIMINADA') NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cxp_proveedor` (`proveedor_id`),
  KEY `fk_cxp_compra` (`compra_id`),
  CONSTRAINT `fk_cxp_compra` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cxp_compra_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of cuentas_pagar
-- ----------------------------

-- ----------------------------
-- Table structure for empresas
-- ----------------------------
DROP TABLE IF EXISTS `empresas`;
CREATE TABLE `empresas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `rut` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `moneda` varchar(10) NOT NULL DEFAULT 'CLP',
  `iva` tinyint(3) unsigned NOT NULL DEFAULT 19,
  `logo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of empresas
-- ----------------------------
INSERT INTO `empresas` VALUES ('1', 'Josechile', '12344', 'cra 6 # 4', '3116645524', 'jose@gmail.com', 'USD', '19', null, '2025-12-04 17:22:53', '2025-12-11 14:56:46', null);
INSERT INTO `empresas` VALUES ('2', 'Empresa Secundaria', '22.222.222-2', null, null, null, 'CLP', '19', null, '2025-12-17 08:31:15', '2025-12-17 08:31:15', null);

-- ----------------------------
-- Table structure for exventas
-- ----------------------------
DROP TABLE IF EXISTS `exventas`;
CREATE TABLE `exventas` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` int(10) unsigned DEFAULT NULL,
  `fecha` date NOT NULL,
  `tipo_documento` varchar(20) NOT NULL,
  `folio` varchar(50) DEFAULT NULL,
  `total_neto` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_impuesto` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_bruto` decimal(18,2) NOT NULL DEFAULT 0.00,
  `estado` enum('EMITIDA','ANULADA','ELIMINADA') NOT NULL DEFAULT 'EMITIDA',
  `observaciones` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_ventas_cliente` (`cliente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of exventas
-- ----------------------------

-- ----------------------------
-- Table structure for failed_jobs
-- ----------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of failed_jobs
-- ----------------------------

-- ----------------------------
-- Table structure for gastos
-- ----------------------------
DROP TABLE IF EXISTS `gastos`;
CREATE TABLE `gastos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `proveedor_id` int(10) unsigned DEFAULT NULL,
  `fecha` date NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(18,2) NOT NULL,
  `es_recurrente` tinyint(1) NOT NULL DEFAULT 0,
  `estado` enum('REGISTRADO','ELIMINADO') NOT NULL DEFAULT 'REGISTRADO',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_gastos_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_cxp_proveedor_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of gastos
-- ----------------------------

-- ----------------------------
-- Table structure for jobs
-- ----------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of jobs
-- ----------------------------

-- ----------------------------
-- Table structure for job_batches
-- ----------------------------
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of job_batches
-- ----------------------------

-- ----------------------------
-- Table structure for mantenimientos_activo
-- ----------------------------
DROP TABLE IF EXISTS `mantenimientos_activo`;
CREATE TABLE `mantenimientos_activo` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `activo_id` int(10) unsigned NOT NULL,
  `fecha` date NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `proveedor_id` int(10) unsigned DEFAULT NULL,
  `costo` decimal(18,2) NOT NULL DEFAULT 0.00,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_mantenimiento_activo` (`activo_id`),
  KEY `fk_mantenimiento_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_mantenimiento_activo` FOREIGN KEY (`activo_id`) REFERENCES `activos_fijos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mantenimiento_activo_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of mantenimientos_activo
-- ----------------------------

-- ----------------------------
-- Table structure for migrations
-- ----------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of migrations
-- ----------------------------
INSERT INTO `migrations` VALUES ('1', '0001_01_01_000000_create_users_table', '1');
INSERT INTO `migrations` VALUES ('2', '0001_01_01_000001_create_cache_table', '1');
INSERT INTO `migrations` VALUES ('3', '0001_01_01_000002_create_jobs_table', '1');
INSERT INTO `migrations` VALUES ('4', '2025_12_03_163405_create_usuarios_table', '2');
INSERT INTO `migrations` VALUES ('5', '2025_12_03_173138_create_usuarios_table', '2');
INSERT INTO `migrations` VALUES ('6', '2025_12_04_000000_add_role_to_users_table', '3');
INSERT INTO `migrations` VALUES ('7', '2025_12_04_000001_add_status_to_users_table', '3');
INSERT INTO `migrations` VALUES ('8', '2026_01_15_120000_add_audit_columns_to_compras_table', '4');
INSERT INTO `migrations` VALUES ('9', '2026_01_16_220000_make_fecha_final_nullable_in_compras_and_ventas', '5');

-- ----------------------------
-- Table structure for movimientos_banco
-- ----------------------------
DROP TABLE IF EXISTS `movimientos_banco`;
CREATE TABLE `movimientos_banco` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cuenta_id` int(10) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `fecha` date NOT NULL,
  `monto` decimal(18,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `tipo_movimiento` enum('EGRESO','INGRESO') NOT NULL,
  `categoria` enum('Transferencia','Cheque','Deposito Bancario','Transbank''Transferencia','Tarjeta Debito','Tarjeta Credito','Pago Online') DEFAULT 'Transferencia',
  `observaciones` varchar(255) DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_movimientos_cuenta` (`cuenta_id`),
  KEY `fk_movimientos_cuenta_fk` (`user_id`),
  CONSTRAINT `fk_movimientos_cuenta` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_bancarias` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_movimientos_cuenta_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of movimientos_banco
-- ----------------------------
INSERT INTO `movimientos_banco` VALUES ('34', '2', '12', '2026-01-17', '1700.00', 'Venta #73 - factura_afecta', 'INGRESO', 'Pago Online', 'Origen: venta:73', '4120', '2026-01-17 23:55:29', '2026-01-17 23:58:48', null);
INSERT INTO `movimientos_banco` VALUES ('35', '6', '12', '2026-01-17', '760.00', 'Pago el granero', 'INGRESO', 'Transferencia', 'Todo se hizo en transferencia.', '1457', '2026-01-17 23:57:29', '2026-01-17 23:57:29', null);

-- ----------------------------
-- Table structure for movimientos_caja
-- ----------------------------
DROP TABLE IF EXISTS `movimientos_caja`;
CREATE TABLE `movimientos_caja` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `caja_id` int(10) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `sucursal_id` bigint(20) unsigned DEFAULT NULL,
  `fecha` date NOT NULL,
  `tipo_movimiento` enum('EGRESO','INGRESO') NOT NULL,
  `monto` decimal(18,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `origen` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_movimientos_caja` (`caja_id`),
  KEY `fk_movimienteo_caja_user` (`user_id`),
  KEY `fk_movimientos_caja_3` (`sucursal_id`),
  CONSTRAINT `fk_movimientos_caja_3` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `movimientos_caja_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `movimientos_caja_ibfk_2` FOREIGN KEY (`caja_id`) REFERENCES `caja_efectivo` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of movimientos_caja
-- ----------------------------
INSERT INTO `movimientos_caja` VALUES ('41', '1', '12', '1', '2026-01-16', 'INGRESO', '4783.80', 'Venta #51 - boleta_afecta', 'venta:51', '2026-01-16 01:29:53', '2026-01-16 01:29:53', null);
INSERT INTO `movimientos_caja` VALUES ('42', '1', '12', '3', '2026-01-16', 'INGRESO', '4000.00', 'fdfsd', null, '2026-01-16 01:31:18', '2026-01-16 01:31:18', null);
INSERT INTO `movimientos_caja` VALUES ('43', '1', '12', '3', '2026-01-16', 'EGRESO', '4000.00', 'dd', null, '2026-01-16 01:31:53', '2026-01-16 01:31:53', null);
INSERT INTO `movimientos_caja` VALUES ('44', '1', '12', '1', '2027-06-15', 'INGRESO', '4756.43', 'Venta #52 - boleta_afecta', 'venta:52', '2027-06-15 05:33:35', '2027-06-15 05:33:35', null);
INSERT INTO `movimientos_caja` VALUES ('45', '1', '12', '3', '2027-06-15', 'INGRESO', '400.00', 'wde', null, '2027-06-15 05:34:26', '2027-06-15 05:34:26', null);
INSERT INTO `movimientos_caja` VALUES ('46', '1', '12', '1', '2026-01-17', 'INGRESO', '400.00', 'Cobro cuenta por cobrar #7', 'CXC', '2026-01-17 15:56:38', '2026-01-17 15:56:38', null);
INSERT INTO `movimientos_caja` VALUES ('47', '1', '12', '1', '2026-01-17', 'INGRESO', '492.50', 'Cobro cuenta por cobrar #7', 'CXC', '2026-01-17 15:58:06', '2026-01-17 15:58:06', null);
INSERT INTO `movimientos_caja` VALUES ('48', '1', '12', '3', '2026-01-17', 'INGRESO', '100.00', 'Venta #59 - factura_afecta', 'venta:59', '2026-01-17 18:26:46', '2026-01-17 18:26:46', null);
INSERT INTO `movimientos_caja` VALUES ('49', '1', '12', '3', '2026-01-17', 'INGRESO', '100.00', 'Venta #61 - factura_afecta', 'venta:61', '2026-01-17 18:56:04', '2026-01-17 18:56:04', null);

-- ----------------------------
-- Table structure for nomina
-- ----------------------------
DROP TABLE IF EXISTS `nomina`;
CREATE TABLE `nomina` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `periodo` varchar(20) NOT NULL,
  `fecha_proceso` date NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` enum('GENERADA','PAGADA','ANULADA') NOT NULL DEFAULT 'GENERADA',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of nomina
-- ----------------------------

-- ----------------------------
-- Table structure for nomina_detalle
-- ----------------------------
DROP TABLE IF EXISTS `nomina_detalle`;
CREATE TABLE `nomina_detalle` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nomina_id` int(10) unsigned NOT NULL,
  `personal_id` int(10) unsigned NOT NULL,
  `sueldo_base` decimal(18,2) NOT NULL DEFAULT 0.00,
  `horas_extras` decimal(10,2) NOT NULL DEFAULT 0.00,
  `monto_horas_extras` decimal(18,2) NOT NULL DEFAULT 0.00,
  `bonos` decimal(18,2) NOT NULL DEFAULT 0.00,
  `descuentos` decimal(18,2) NOT NULL DEFAULT 0.00,
  `imponible` decimal(18,2) NOT NULL DEFAULT 0.00,
  `liquido_pagar` decimal(18,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_nomina_detalle_nomina` (`nomina_id`),
  KEY `fk_nomina_detalle_personal` (`personal_id`),
  CONSTRAINT `fk_nomina_detalle_nomina` FOREIGN KEY (`nomina_id`) REFERENCES `nomina` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nomina_detalle_personal` FOREIGN KEY (`personal_id`) REFERENCES `personal` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of nomina_detalle
-- ----------------------------

-- ----------------------------
-- Table structure for otros_egresos
-- ----------------------------
DROP TABLE IF EXISTS `otros_egresos`;
CREATE TABLE `otros_egresos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(18,2) NOT NULL,
  `destino` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of otros_egresos
-- ----------------------------

-- ----------------------------
-- Table structure for otros_ingresos
-- ----------------------------
DROP TABLE IF EXISTS `otros_ingresos`;
CREATE TABLE `otros_ingresos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(18,2) NOT NULL,
  `origen` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of otros_ingresos
-- ----------------------------

-- ----------------------------
-- Table structure for pagos_cuentas_cobrar
-- ----------------------------
DROP TABLE IF EXISTS `pagos_cuentas_cobrar`;
CREATE TABLE `pagos_cuentas_cobrar` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cuenta_cobrar_id` int(10) unsigned NOT NULL,
  `fecha_pago` date NOT NULL,
  `monto_pagado` decimal(18,2) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_pagos_cxc` (`cuenta_cobrar_id`),
  CONSTRAINT `fk_pagos_cxc` FOREIGN KEY (`cuenta_cobrar_id`) REFERENCES `cuentas_cobrar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of pagos_cuentas_cobrar
-- ----------------------------

-- ----------------------------
-- Table structure for pagos_cuentas_pagar
-- ----------------------------
DROP TABLE IF EXISTS `pagos_cuentas_pagar`;
CREATE TABLE `pagos_cuentas_pagar` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cuenta_pagar_id` int(10) unsigned NOT NULL,
  `fecha_pago` date NOT NULL,
  `monto_pagado` decimal(18,2) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_pagos_cxp` (`cuenta_pagar_id`),
  CONSTRAINT `fk_pagos_cxp` FOREIGN KEY (`cuenta_pagar_id`) REFERENCES `cuentas_pagar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of pagos_cuentas_pagar
-- ----------------------------

-- ----------------------------
-- Table structure for password_reset_tokens
-- ----------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of password_reset_tokens
-- ----------------------------

-- ----------------------------
-- Table structure for personal
-- ----------------------------
DROP TABLE IF EXISTS `personal`;
CREATE TABLE `personal` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(150) NOT NULL,
  `documento` varchar(50) NOT NULL,
  `tipo_documento` varchar(20) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `fecha_salida` date DEFAULT NULL,
  `salario_base` decimal(18,2) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_personal_documento` (`documento`,`tipo_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of personal
-- ----------------------------

-- ----------------------------
-- Table structure for proveedores
-- ----------------------------
DROP TABLE IF EXISTS `proveedores`;
CREATE TABLE `proveedores` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
  `rut` varchar(20) NOT NULL,
  `razon_social` varchar(255) NOT NULL,
  `giro` varchar(255) DEFAULT NULL,
  `nombre_comercial` varchar(255) DEFAULT NULL,
  `pagina_web` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  `comuna` varchar(255) NOT NULL,
  `region` varchar(255) NOT NULL,
  `ciudad` varchar(255) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `correo_finanzas` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `nombre_vendedor` varchar(255) DEFAULT NULL,
  `celular_vendedor` varchar(20) DEFAULT NULL,
  `correo_vendedor` varchar(255) DEFAULT NULL,
  `metodo_pago` enum('efectivo','cheque','transferencia') DEFAULT 'efectivo',
  `banco_nombre_titular` varchar(255) DEFAULT NULL,
  `banco_rut_titular` varchar(20) DEFAULT NULL,
  `banco_nombre` varchar(100) DEFAULT NULL,
  `banco_tipo_cuenta` varchar(50) DEFAULT NULL,
  `banco_numero_cuenta` varchar(50) DEFAULT NULL,
  `banco_correo` varchar(255) DEFAULT NULL,
  `limite_credito` decimal(18,2) DEFAULT NULL,
  `estado` varchar(255) NOT NULL DEFAULT 'activo',
  `historial_estados` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `comentario` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proveedores_rut` (`rut`),
  KEY `idx_proveedores_region` (`region`),
  KEY `idx_proveedores_deleted_at` (`deleted_at`),
  KEY `idx_proveedores_metodo_pago` (`metodo_pago`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of proveedores
-- ----------------------------
INSERT INTO `proveedores` VALUES ('4', '121541021', 'hbjbdsjhbdj', 'sasdsad', 'dsqdsadaaa', 'https://chat.deepseek.com/a/chat', 'qdwwqd544', 'Arica', '1', 'knjnjk', 'correo1@gmail.com', null, '3212124', null, 'peds', '12212121', 'vendedor1@gmail.com', 'transferencia', null, null, null, null, null, null, '150.00', 'activo', 0x5B7B226665636861223A22323032352D31322D31312030333A33303A3034222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A224372656163695C75303066336E222C22646574616C6C6573223A224372656163695C75303066336E20696E696369616C2064656C2070726F766565646F72227D5D, 'ksnkjndskj', '2025-12-11 03:30:04', '2025-12-11 03:49:47', null);
INSERT INTO `proveedores` VALUES ('5', '154554', '1212112', 'Giro', 'Fantasia', 'https://chat.deepseek.com/a/chat/s', 'hjjdsjqsndj', 'Arica', '1', '51514515', 'ghsgh@gmail.com', null, '54451', null, 'sadsd', 'dsds', 'ghsgh@gmail.com', 'transferencia', null, null, null, null, null, null, '170.00', 'inactivo', 0x5B7B226665636861223A22323032352D31322D31312030333A33363A3434222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A224372656163695C75303066336E222C22646574616C6C6573223A224372656163695C75303066336E20696E696369616C2064656C2070726F766565646F72227D2C7B226665636861223A22323032352D31322D31312030333A33373A3536222C227573756172696F223A2253757065722041646D696E6973747261646F72222C22616363696F6E223A22496E61637469766163695C75303066336E222C22646574616C6C6573223A2250726F766565646F7220696E616374697661646F227D5D, 'test', '2025-12-11 03:36:44', '2025-12-11 03:37:56', null);

-- ----------------------------
-- Table structure for registros_eliminados
-- ----------------------------
DROP TABLE IF EXISTS `registros_eliminados`;
CREATE TABLE `registros_eliminados` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tabla` varchar(100) NOT NULL,
  `registro_id` int(10) unsigned NOT NULL,
  `datos_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_json`)),
  `eliminado_por` int(10) unsigned DEFAULT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `eliminado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_registros_eliminados_usuario` (`eliminado_por`),
  CONSTRAINT `fk_registros_eliminados_usuario` FOREIGN KEY (`eliminado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of registros_eliminados
-- ----------------------------

-- ----------------------------
-- Table structure for respaldos
-- ----------------------------
DROP TABLE IF EXISTS `respaldos`;
CREATE TABLE `respaldos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tipo` enum('manual','automatico') NOT NULL DEFAULT 'manual',
  `archivo` varchar(255) DEFAULT NULL,
  `ruta` varchar(255) DEFAULT NULL,
  `estado` enum('PENDIENTE','COMPLETADO','FALLIDO') NOT NULL DEFAULT 'COMPLETADO',
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `detalles` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `respaldos_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `respaldos_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of respaldos
-- ----------------------------
INSERT INTO `respaldos` VALUES ('2', 'manual', null, null, 'FALLIDO', null, 'Class \"Spatie\\DbDumper\\Databases\\MySql\" not found', '2025-12-04 18:36:06', '2025-12-04 18:36:06');
INSERT INTO `respaldos` VALUES ('3', 'manual', null, null, 'FALLIDO', null, 'Class \"Spatie\\DbDumper\\Databases\\MySql\" not found', '2025-12-06 15:37:47', '2025-12-06 15:37:47');

-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of sessions
-- ----------------------------
INSERT INTO `sessions` VALUES ('2LVmWsio2tpF5DQ95LVmgype2yaMWWx5oJOBUE3d', null, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSW81REY5ZWQxZjlxeDNpdjE4a2pxcTJnd0hYbmt3dkFYb3A2QXpRdiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvc3VjdXJzYWxlcyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', '1766237353');
INSERT INTO `sessions` VALUES ('HoS5NkBGPG0xNU7IwNZY4qdlJ1C9Exc55LD3sxQr', null, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibEx0OUNCeWljTjNlZHoyTFNzRXk0N29xd0cwSHVKdml1UXI3S0F1cCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvc3VjdXJzYWxlcyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', '1766240312');

-- ----------------------------
-- Table structure for sucursales
-- ----------------------------
DROP TABLE IF EXISTS `sucursales`;
CREATE TABLE `sucursales` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sucursales_empresa_id_foreign` (`empresa_id`),
  CONSTRAINT `sucursales_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of sucursales
-- ----------------------------
INSERT INTO `sucursales` VALUES ('1', '2', 'Norte_2', 'cra 75 - 87', '321456', '2025-12-13 09:59:03', null, null);
INSERT INTO `sucursales` VALUES ('2', '2', 'Sur', 'cra 5 - 87', '3254151', '2025-12-13 09:59:03', null, null);
INSERT INTO `sucursales` VALUES ('3', '2', 'Chilenita', 'cra 21', '32144', '2025-12-13 15:06:00', '2025-12-13 15:06:00', null);
INSERT INTO `sucursales` VALUES ('4', '2', 'Norte Buena vista', 'cra 45 - 51', '123457', '2025-12-17 13:45:13', '2025-12-17 13:45:13', null);
INSERT INTO `sucursales` VALUES ('5', '2', 'Sur Cordialida', 'cra 21 - 51', null, '2025-12-17 13:45:37', '2025-12-17 13:45:37', null);

-- ----------------------------
-- Table structure for sucursales_copy
-- ----------------------------
DROP TABLE IF EXISTS `sucursales_copy`;
CREATE TABLE `sucursales_copy` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sucursales_empresa_id_foreign` (`empresa_id`),
  CONSTRAINT `sucursales_copy_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of sucursales_copy
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_sucursal` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMINISTRADOR','VENDEDOR','SUPERVISOR') NOT NULL DEFAULT 'ADMINISTRADOR',
  `status` enum('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `Fk_User_S` (`id_sucursal`),
  CONSTRAINT `Fk_User_S` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursales` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('12', '1', 'Super Administrador', 'superadmin@local', null, '$2y$12$a3rJbXzLziEEpyaPBSHeEuXynKKlAXso9RlbirbYvx9GjVq4oifxy', 'ADMINISTRADOR', 'ACTIVO', null, '2025-12-17 13:43:39', '2025-12-17 13:54:12', null);
INSERT INTO `users` VALUES ('13', '1', 'Supervisor General', 'supervisor@local', null, '$2y$12$3ldYu6NYTtlAvtVtb1YqZeSSUmbdDUyn/ou7Jqr0I5GLgQqfBapJK', 'SUPERVISOR', 'ACTIVO', null, '2025-12-17 13:43:39', '2025-12-17 14:04:33', null);
INSERT INTO `users` VALUES ('14', '1', 'Vendedor Demo', 'vendedor@local', null, '$2y$12$Nnt..UX/KRiw2ERqVTxA8OH1qqoI0iP.AcKhCWtVYsCjVnYbnXGvy', 'VENDEDOR', 'ACTIVO', null, '2025-12-17 13:43:40', '2025-12-17 13:43:40', null);

-- ----------------------------
-- Table structure for usuarios
-- ----------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(150) DEFAULT NULL,
  `rol` enum('ADMIN','CONTADOR','AUXILIAR','INVITADO') NOT NULL DEFAULT 'AUXILIAR',
  `esta_activo` tinyint(1) NOT NULL DEFAULT 1,
  `ultimo_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- ----------------------------
-- Records of usuarios
-- ----------------------------
INSERT INTO `usuarios` VALUES ('1', 'admin_user', 'admin@empresa.com', '$2y$10$rHWn9MQXZhbXh37pR5xAl.1APX3bbk6KVp9K9F1stHkKTnGBoJdKK', 'Administrador Principal', 'ADMIN', '1', null, '2025-12-17 08:31:15', null);
INSERT INTO `usuarios` VALUES ('2', 'vendedor_user', 'vendedor@empresa.com', '$2y$10$rHWn9MQXZhbXh37pR5xAl.1APX3bbk6KVp9K9F1stHkKTnGBoJdKK', 'Vendedor Ejemplo', 'AUXILIAR', '1', null, '2025-12-17 08:31:15', null);
INSERT INTO `usuarios` VALUES ('3', 'supervisor_user', 'supervisor@empresa.com', '$2y$10$rHWn9MQXZhbXh37pR5xAl.1APX3bbk6KVp9K9F1stHkKTnGBoJdKK', 'Supervisor Control', 'CONTADOR', '1', null, '2025-12-17 08:31:15', null);

-- ----------------------------
-- Table structure for ventas
-- ----------------------------
DROP TABLE IF EXISTS `ventas`;
CREATE TABLE `ventas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `fecha_final` datetime DEFAULT NULL,
  `sucursal_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` int(10) unsigned DEFAULT NULL,
  `sucursal_nombre` varchar(255) DEFAULT NULL,
  `documentoVenta` varchar(100) DEFAULT NULL,
  `folioVenta` varchar(100) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `iva` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `metodos_pago` enum('Efectivo','Transferencia','Tarjeta Debito','Tarjeta Credito','Cheque','Pago Online','Credito (Deuda)') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT 'Transferencia',
  `observaciones` text DEFAULT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'REGISTRADA',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ventas_cliente` (`cliente_id`),
  KEY `idx_ventas_sucursal` (`sucursal_id`),
  CONSTRAINT `fk_ventas_1` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `fk_ventas_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of ventas
-- ----------------------------
INSERT INTO `ventas` VALUES ('72', '2026-01-17 00:00:00', null, '3', null, null, 'factura_afecta', '1241', '454.00', '86.00', '540.00', 'Tarjeta Debito', 'Test 2026', 'REGISTRADA', '2026-01-17 23:54:15', '2026-01-18 01:01:11', '2026-01-18 01:01:11');
INSERT INTO `ventas` VALUES ('73', '2026-01-17 00:00:00', null, '1', '3', null, 'factura_afecta', '4120', '1429.00', '271.00', '1700.00', 'Pago Online', 'Test 4', 'REGISTRADA', '2026-01-17 23:55:29', '2026-01-17 23:58:48', null);
INSERT INTO `ventas` VALUES ('74', '2026-01-18 00:00:00', '2026-01-20 00:00:00', '4', '3', null, 'factura_exenta', '5401', '1000.00', '0.00', '1000.00', 'Tarjeta Credito', 'Test credito', 'REGISTRADA', '2026-01-18 00:02:08', '2026-01-18 00:58:58', null);

-- ----------------------------
-- Table structure for ventas_detalle
-- ----------------------------
DROP TABLE IF EXISTS `ventas_detalle`;
CREATE TABLE `ventas_detalle` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `descripcion` varchar(1000) DEFAULT NULL,
  `cantidad` decimal(18,4) NOT NULL DEFAULT 1.0000,
  `precio_unitario` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `total_linea` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_detalle_venta` (`venta_id`),
  CONSTRAINT `fk_detallesvetas` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of ventas_detalle
-- ----------------------------
INSERT INTO `ventas_detalle` VALUES ('107', '72', null, 'test', '1.0000', '540.0000', '540.0000', '2026-01-17 23:54:15', '2026-01-18 01:01:11', '2026-01-18 01:01:11');
INSERT INTO `ventas_detalle` VALUES ('108', '73', null, 'test', '1.0000', '700.0000', '700.0000', '2026-01-17 23:55:29', '2026-01-17 23:58:48', '2026-01-17 23:58:48');
INSERT INTO `ventas_detalle` VALUES ('109', '73', null, 'test', '1.0000', '1700.0000', '1700.0000', '2026-01-17 23:58:48', '2026-01-17 23:58:48', null);
INSERT INTO `ventas_detalle` VALUES ('110', '74', null, 'Test 240', '1.0000', '840.0000', '840.0000', '2026-01-18 00:02:08', '2026-01-18 00:04:42', '2026-01-18 00:04:42');
INSERT INTO `ventas_detalle` VALUES ('111', '74', null, 'Test 240', '1.0000', '900.0000', '900.0000', '2026-01-18 00:04:42', '2026-01-18 00:06:26', '2026-01-18 00:06:26');
INSERT INTO `ventas_detalle` VALUES ('112', '74', null, 'ghgah', '1.0000', '1000.0000', '1000.0000', '2026-01-18 00:58:59', '2026-01-18 00:58:59', null);
SET FOREIGN_KEY_CHECKS=1;
