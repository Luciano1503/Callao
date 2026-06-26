CREATE TABLE IF NOT EXISTS callao.vip_registry (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(8) NOT NULL UNIQUE,
    nombres VARCHAR(160) NOT NULL,
    creado_por INTEGER NOT NULL,
    creado_en TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vip_registry_creado_por FOREIGN KEY (creado_por) REFERENCES callao.usuarios (id)
);

CREATE INDEX IF NOT EXISTS idx_vip_registry_dni ON callao.vip_registry(dni);
