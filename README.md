# 📱 Gestor de Prepago

Aplicación web para registrar números de prepago chilenos (con prefijo +56 9), empresas de telefonía y el historial de la última recarga.

## 🚀 Características

- ✅ Registro de contactos con nombre, empresa y número
- ✅ Prefijo fijo **+56 9** + 8 dígitos
- ✅ Empresas: Entel, Movistar, Claro, WOM, Virgin, etc.
- ✅ Registro de última recarga (monto + fecha)
- ✅ Editar y eliminar contactos
- ✅ Búsqueda en tiempo real
- ✅ Datos sincronizados en **Supabase** (accesibles desde cualquier lugar)

## 🗄️ Configuración de Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com) y un nuevo proyecto.
2. Ve a **SQL Editor** y ejecuta este script para crear la tabla:

```sql
create table contactos_prepago (
  id uuid primary key default gen_random_uuid(),
  nombre_usuario text not null,
  empresa text not null,
  numero text not null,
  ultima_recarga_monto numeric,
  ultima_recarga_fecha date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS (seguridad)
alter table contactos_prepago enable row level security;

-- Política abierta para lectura/escritura (ajusta según tu necesidad)
create policy "Permitir todo" on contactos_prepago
  for all using (true) with check (true);
```

3. Ve a **Settings → API** y copia:
   - `Project URL`
   - `anon public` key

4. Abre `script.js` y reemplaza las líneas:
   ```js
   const SUPABASE_URL = "TU_SUPABASE_URL";
   const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";
   ```

## 💻 Uso local

Simplemente abre `index.html` en tu navegador. ¡No requiere servidor!

## 🌐 Subir a GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. Selecciona la rama `main` y carpeta `/ (root)`.
4. Accede a tu app desde `https://tu-usuario.github.io/nombre-repo/`.

## 🔒 Seguridad (recomendado)

La clave `anon` es pública por diseño, pero para producción se recomienda:
- Crear políticas RLS más específicas en Supabase
- O usar autenticación de Supabase para limitar el acceso