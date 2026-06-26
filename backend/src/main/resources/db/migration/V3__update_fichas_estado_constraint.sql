ALTER TABLE callao.fichas_veedor DROP CONSTRAINT IF EXISTS chk_ficha_veedor_estado;
ALTER TABLE callao.fichas_veedor ADD CONSTRAINT chk_ficha_veedor_estado CHECK (estado IN ('EN_PROCESO', 'GUARDADO', 'BLOQUEADO', 'FINALIZADO'));

ALTER TABLE callao.fichas_circuito DROP CONSTRAINT IF EXISTS chk_ficha_circuito_estado;
ALTER TABLE callao.fichas_circuito ADD CONSTRAINT chk_ficha_circuito_estado CHECK (estado IN ('EN_PROCESO', 'GUARDADO', 'BLOQUEADO', 'FINALIZADO'));
