-- ==========================================
-- MIGRACIÓN: Sistema de Uso Diario WhatsApp
-- ==========================================
-- Fecha: 2026-02-09
-- Descripción: Tabla para trackear el uso diario del bot de WhatsApp
--              por usuario (puntos, audios, textos). Permite persistir
--              los límites y mostrar el uso en la app móvil.
-- ==========================================

-- 1. Crear tabla de uso de WhatsApp
-- ==========================================
CREATE TABLE IF NOT EXISTS whatsapp_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    points_used INTEGER NOT NULL DEFAULT 0 CHECK (points_used >= 0),
    audio_count INTEGER NOT NULL DEFAULT 0 CHECK (audio_count >= 0),
    text_count INTEGER NOT NULL DEFAULT 0 CHECK (text_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 2. Crear índices
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_whatsapp_usage_user_id ON whatsapp_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_usage_user_date ON whatsapp_usage(user_id, date);

-- 3. Habilitar RLS (Row Level Security)
-- ==========================================
ALTER TABLE whatsapp_usage ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio uso
CREATE POLICY "Users can view own usage" ON whatsapp_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar su propio uso
CREATE POLICY "Users can insert own usage" ON whatsapp_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar su propio uso
CREATE POLICY "Users can update own usage" ON whatsapp_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar su propio uso
CREATE POLICY "Users can delete own usage" ON whatsapp_usage
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Trigger para updated_at
-- ==========================================
CREATE EXTENSION IF NOT EXISTS moddatetime;

DROP TRIGGER IF EXISTS trigger_whatsapp_usage_updated_at ON whatsapp_usage;
CREATE TRIGGER trigger_whatsapp_usage_updated_at
    BEFORE UPDATE ON whatsapp_usage
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- FIN DE LA MIGRACIÓN
-- ==========================================

-- Para verificar:
-- SELECT * FROM whatsapp_usage WHERE user_id = auth.uid() AND date = CURRENT_DATE;
