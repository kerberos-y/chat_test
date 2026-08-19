-- Таблиця sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL, -- для майбутньої авторизації
    title TEXT,
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    system_prompt TEXT,
    total_tokens_prompt INT DEFAULT 0,
    total_tokens_completion INT DEFAULT 0,
    total_cost_usd NUMERIC(12,6) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблиця messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_prompt INT,
    tokens_completion INT,
    cost_usd NUMERIC(12,6),
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблиця model_pricing
CREATE TABLE IF NOT EXISTS model_pricing (
    model TEXT PRIMARY KEY,
    input_price_per_1k NUMERIC(12,6) NOT NULL,
    output_price_per_1k NUMERIC(12,6) NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT now()
);

-- Функція тригера для оновлення агрегатів сесії при вставці повідомлення асистента
CREATE OR REPLACE FUNCTION update_session_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'assistant' AND NEW.tokens_prompt IS NOT NULL AND NEW.tokens_completion IS NOT NULL THEN
        UPDATE sessions
        SET 
            total_tokens_prompt = total_tokens_prompt + NEW.tokens_prompt,
            total_tokens_completion = total_tokens_completion + NEW.tokens_completion,
            total_cost_usd = total_cost_usd + NEW.cost_usd,
            updated_at = now()
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Створюємо тригер
DROP TRIGGER IF EXISTS update_session_totals_trigger ON messages;
CREATE TRIGGER update_session_totals_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_session_totals();

-- Автоматичне оновлення updated_at для sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();