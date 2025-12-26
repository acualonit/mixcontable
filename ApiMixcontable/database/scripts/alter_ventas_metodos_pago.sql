-- Script para actualizar la tabla `ventas` respecto a metodos de pago.
-- Ejecutar en MySQL 8+ preferiblemente. Si tu servidor no soporta JSON, usar la sección "FALLBACK" (usar TEXT).

-- Opción A (recomendada si MySQL soporta JSON):
ALTER TABLE `ventas` 
  MODIFY COLUMN `metodos_pago` JSON NULL DEFAULT NULL;

ALTER TABLE `ventas`
  ADD COLUMN `metodos_pago_detalle` JSON NULL AFTER `metodos_pago`;

-- Opción B (FALLBACK si JSON no está soportado):
-- ALTER TABLE `ventas` 
--   MODIFY COLUMN `metodos_pago` TEXT NULL DEFAULT NULL;
--
-- ALTER TABLE `ventas`
--   ADD COLUMN `metodos_pago_detalle` TEXT NULL AFTER `metodos_pago`;

-- Nota: tras ejecutar el script, reinicia el servidor de Laravel (si usas php artisan serve).
-- Para correrlo desde línea de comandos MySQL:
-- mysql -u tu_usuario -p nombre_bd < alter_ventas_metodos_pago.sql
