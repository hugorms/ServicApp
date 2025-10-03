# 🗄️ CONFIGURACIÓN MYSQL CON XAMPP

## ⚡ PASOS PARA MIGRAR A MYSQL

### 1. **EJECUTAR SCRIPTS SQL EN XAMPP:**
```sql
-- ORDEN DE EJECUCIÓN:
-- 1. mysql-setup-01-users.sql      - Tabla de usuarios
-- 2. mysql-setup-02-posts.sql      - Posts y aplicaciones
-- 3. mysql-setup-03-notifications.sql - Notificaciones e historial
-- 4. mysql-setup-04-triggers.sql   - Triggers automáticos
-- 5. mysql-setup-05-chat.sql       - Sistema de chat
-- 6. mysql-setup-06-agenda.sql     - Sistema de agenda
```

### 2. **CAMBIAR IMPORTACIÓN EN REACT:**
```javascript
// ANTES (Supabase):
import { supabase } from '../utils/supabaseClient';

// DESPUÉS (MySQL):
import { supabase } from '../utils/mysqlClient';
```

### 3. **CREAR API PHP (FALTA HACER):**
Necesitas crear carpeta: `C:/xampp/htdocs/servicios_app/api/`

Con archivos PHP para:
- `auth/signup.php`
- `auth/signin.php`
- `query/select.php`
- `query/insert.php`
- `query/update.php`
- `query/delete.php`
- `storage/upload.php`

## 📊 **DIFERENCIAS MYSQL vs SUPABASE:**

| SUPABASE | MYSQL |
|----------|-------|
| UUID | AUTO_INCREMENT |
| JSONB | JSON |
| TIMESTAMPTZ | TIMESTAMP |
| Row Level Security | Sin RLS |
| PostgREST API | API PHP personalizada |

## ✅ **FUNCIONALIDADES MANTENIDAS:**
- ✅ **Fotos** - URLs en VARCHAR(500)
- ✅ **Chat** - Tablas completas
- ✅ **Agenda** - Sistema completo
- ✅ **Triggers** - Notificaciones automáticas
- ✅ **Ratings** - Cálculo automático
- ✅ **Todo el workflow** exacto

## 🚨 **LO QUE FALTA:**
- Crear archivos PHP para la API
- Configurar CORS en PHP
- Mover fotos a carpeta local XAMPP

¿Quieres que cree los archivos PHP de la API?