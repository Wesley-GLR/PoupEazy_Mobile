-- PoupEazy | Migrações 005_whatsapp e 006_whatsapp_report
-- Execute no PostgreSQL já inicializado que a API do Render usa.
-- O script pode ser executado novamente no mesmo banco.

BEGIN;

CREATE TABLE IF NOT EXISTS whatsapp_vinculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    wa_id VARCHAR(15) NOT NULL UNIQUE CHECK (wa_id ~ '^[1-9][0-9]{6,14}$'),
    pendencia JSONB,
    pendencia_expira_em TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS whatsapp_codigos (
    id_usuario UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    codigo_hash CHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL
);

-- O registro fica mesmo após a entrega para impedir que um reenvio crie outro gasto.
CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
    id VARCHAR(255) PRIMARY KEY,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_vinculo UUID REFERENCES whatsapp_vinculos(id) ON DELETE CASCADE,
    resposta TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_criada ON whatsapp_mensagens (criada_em);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_vinculo ON whatsapp_mensagens (id_vinculo);

ALTER TABLE whatsapp_mensagens ADD COLUMN IF NOT EXISTS relatorio JSONB;

COMMIT;
