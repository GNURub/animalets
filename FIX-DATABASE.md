# 🔧 Corrección Urgente de Base de Datos

## ⚠️ Problemas Detectados

1. **PGRST204**: La columna `species` no existe en la tabla `pets`
2. **42P17**: Recursión infinita en las políticas RLS de `profiles`

## 🚀 Solución

Debes ejecutar la migración `20251024000002_fix_schema_and_rls.sql` en tu base de datos de Supabase.

### Opción 1: Usando Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral, haz clic en **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido completo del archivo:
   ```
   supabase/migrations/20251024000002_fix_schema_and_rls.sql
   ```
5. Haz clic en **Run** (o presiona Ctrl+Enter)
6. Verifica que no haya errores

### Opción 2: Usando Supabase CLI

Si tienes Supabase CLI instalado:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Desde la raíz del proyecto
supabase db push
```

## 📋 Cambios que realiza la migración

### 1. Agregar columna `species` a `pets`

```sql
ALTER TABLE pets ADD COLUMN species TEXT NOT NULL DEFAULT 'dog'
  CHECK (species IN ('dog', 'cat', 'other'));
```

### 2. Corregir políticas RLS (eliminar recursión)

- Elimina políticas problemáticas de `profiles`
- Crea nuevas políticas que no causan recursión infinita
- Actualiza políticas en todas las tablas para usar consultas más eficientes

### 3. Renombrar columnas de `appointments`

- `date` → `scheduled_date`
- `start_time` → `scheduled_time`
- Mantiene `end_time`

## ✅ Verificación

Después de ejecutar la migración, verifica:

1. **Columna species existe**:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pets' AND column_name = 'species';
```

2. **No hay recursión en políticas**:

```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

3. **Puedes crear mascotas**:

```sql
INSERT INTO pets (owner_id, name, species, breed)
VALUES (auth.uid(), 'Test', 'dog', 'Labrador');
```

## 🔄 Después de ejecutar la migración

Reinicia tu servidor de desarrollo:

```bash
# Detener el servidor (Ctrl+C en la terminal)
# Iniciar de nuevo
pnpm run dev
```

## 🆘 Si algo sale mal

Si encuentras errores al ejecutar la migración, contacta al equipo de desarrollo con:

- El mensaje de error completo
- Capturas de pantalla del SQL Editor
- La versión de PostgreSQL que estás usando

## 📝 Notas Importantes

- ⚠️ Esta migración es **segura** para ejecutar en producción
- ✅ No elimina datos existentes
- ✅ Agrega validaciones para mantener integridad de datos
- ✅ Corrige problemas de rendimiento causados por recursión infinita
