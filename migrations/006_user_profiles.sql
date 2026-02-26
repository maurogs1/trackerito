-- ==========================================
-- MIGRACIÓN: Sistema de Perfiles de Usuario
-- ==========================================
-- Fecha: 2026-02-04
-- Descripción: Agregar tabla de perfiles para datos adicionales del usuario
--              (teléfono para notificaciones WhatsApp, etc.)
-- ==========================================

-- 1. Crear tabla de perfiles de usuario
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    phone_number TEXT,
    whatsapp_notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number) WHERE phone_number IS NOT NULL;

-- 3. Habilitar RLS (Row Level Security)
-- ==========================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar su propio perfil
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Trigger para updated_at
-- ==========================================
CREATE EXTENSION IF NOT EXISTS moddatetime;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- FIN DE LA MIGRACIÓN
-- ==========================================

-- Para verificar:
-- SELECT * FROM user_profiles WHERE user_id = auth.uid();
