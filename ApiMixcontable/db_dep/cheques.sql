/*
Navicat MariaDB Data Transfer

Source Server         : DB Locales
Source Server Version : 100427
Source Host           : localhost:3306
Source Database       : mixcontable

Target Server Type    : MariaDB
Target Server Version : 100427
File Encoding         : 65001

Date: 2026-01-23 09:40:09
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for cheques
-- ----------------------------
DROP TABLE IF EXISTS `cheques`;
CREATE TABLE `cheques` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cuenta_id` int(10) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `numero_cheque` varchar(50) NOT NULL,
  `tipo` enum('Emitidos','Recibidos') DEFAULT 'Emitidos',
  `fecha_emision` date NOT NULL,
  `fecha_cobro` date DEFAULT NULL,
  `beneficiario` varchar(150) NOT NULL,
  `concepto` varchar(255) DEFAULT NULL,
  `monto` decimal(18,2) NOT NULL,
  `estado` enum('Pendiente','Cobrado','Rechazado','Prestado') DEFAULT 'Pendiente',
  `observaciones` varchar(255) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cheque_numero` (`cuenta_id`,`numero_cheque`),
  KEY `fk_user` (`user_id`),
  CONSTRAINT `fk_cheques_cuenta` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_bancarias` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
SET FOREIGN_KEY_CHECKS=1;
