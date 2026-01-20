/*
Navicat MariaDB Data Transfer

Source Server         : DB Locales
Source Server Version : 100427
Source Host           : localhost:3306
Source Database       : mixcontable

Target Server Type    : MariaDB
Target Server Version : 100427
File Encoding         : 65001

Date: 2026-01-20 10:25:39
*/

SET FOREIGN_KEY_CHECKS=0;

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
SET FOREIGN_KEY_CHECKS=1;
