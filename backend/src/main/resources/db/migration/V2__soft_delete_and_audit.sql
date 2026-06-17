-- Soft Delete and Audit Migration

-- 1. Remove ON DELETE CASCADE
ALTER TABLE callao.verificaciones_correo DROP CONSTRAINT IF EXISTS verificaciones_correo_usuario_id_fkey;
ALTER TABLE callao.verificaciones_correo ADD CONSTRAINT verificaciones_correo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES callao.usuarios(id);

ALTER TABLE callao.evaluados_grupo DROP CONSTRAINT IF EXISTS evaluados_grupo_grupo_id_fkey;
ALTER TABLE callao.evaluados_grupo ADD CONSTRAINT evaluados_grupo_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES callao.grupos_evaluacion(id);

ALTER TABLE callao.fichas_circuito DROP CONSTRAINT IF EXISTS fichas_circuito_evaluado_grupo_id_fkey;
ALTER TABLE callao.fichas_circuito ADD CONSTRAINT fichas_circuito_evaluado_grupo_id_fkey FOREIGN KEY (evaluado_grupo_id) REFERENCES callao.evaluados_grupo(id);

ALTER TABLE callao.fichas_veedor DROP CONSTRAINT IF EXISTS fichas_veedor_grupo_id_fkey;
ALTER TABLE callao.fichas_veedor ADD CONSTRAINT fichas_veedor_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES callao.grupos_evaluacion(id);

ALTER TABLE callao.fichas_veedor_detalle DROP CONSTRAINT IF EXISTS fichas_veedor_detalle_ficha_veedor_id_fkey;
ALTER TABLE callao.fichas_veedor_detalle ADD CONSTRAINT fichas_veedor_detalle_ficha_veedor_id_fkey FOREIGN KEY (ficha_veedor_id) REFERENCES callao.fichas_veedor(id);

ALTER TABLE callao.fichas_veedor_detalle DROP CONSTRAINT IF EXISTS fichas_veedor_detalle_evaluado_grupo_id_fkey;
ALTER TABLE callao.fichas_veedor_detalle ADD CONSTRAINT fichas_veedor_detalle_evaluado_grupo_id_fkey FOREIGN KEY (evaluado_grupo_id) REFERENCES callao.evaluados_grupo(id);

ALTER TABLE callao.fichas_veedor_detalle_criterios DROP CONSTRAINT IF EXISTS fichas_veedor_detalle_criterios_ficha_veedor_detalle_id_fkey;
ALTER TABLE callao.fichas_veedor_detalle_criterios ADD CONSTRAINT fichas_veedor_detalle_criterios_ficha_veedor_detalle_id_fkey FOREIGN KEY (ficha_veedor_detalle_id) REFERENCES callao.fichas_veedor_detalle(id);

-- 2. Add is_active for Soft Delete
ALTER TABLE callao.usuarios ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE callao.grupos_evaluacion ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE callao.evaluados_grupo ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE callao.fichas_circuito ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE callao.fichas_veedor ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Add Audit Columns (creado_por, actualizado_por, actualizado_en si no existen)
ALTER TABLE callao.usuarios ADD COLUMN IF NOT EXISTS actualizado_por BIGINT REFERENCES callao.usuarios(id);

ALTER TABLE callao.grupos_evaluacion ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE callao.grupos_evaluacion ADD COLUMN IF NOT EXISTS creado_por BIGINT REFERENCES callao.usuarios(id);
ALTER TABLE callao.grupos_evaluacion ADD COLUMN IF NOT EXISTS actualizado_por BIGINT REFERENCES callao.usuarios(id);

ALTER TABLE callao.evaluados_grupo ADD COLUMN IF NOT EXISTS creado_por BIGINT REFERENCES callao.usuarios(id);
ALTER TABLE callao.evaluados_grupo ADD COLUMN IF NOT EXISTS actualizado_por BIGINT REFERENCES callao.usuarios(id);

ALTER TABLE callao.fichas_circuito ADD COLUMN IF NOT EXISTS creado_por BIGINT REFERENCES callao.usuarios(id);
ALTER TABLE callao.fichas_circuito ADD COLUMN IF NOT EXISTS actualizado_por BIGINT REFERENCES callao.usuarios(id);

ALTER TABLE callao.fichas_veedor ADD COLUMN IF NOT EXISTS creado_por BIGINT REFERENCES callao.usuarios(id);
ALTER TABLE callao.fichas_veedor ADD COLUMN IF NOT EXISTS actualizado_por BIGINT REFERENCES callao.usuarios(id);
