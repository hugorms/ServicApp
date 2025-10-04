// Cliente MySQL para conectar con API Node.js
const API_BASE_URL = 'http://localhost:3009/api';

class MySQLClient {
  // Insertar registro
  async insert(table, data) {
    try {
      const token = sessionStorage.getItem('token');

      // Si no hay token, retornar error sin hacer petición
      if (!token) {
        console.log('⚠️ MySQL insert: Sin token');
        return { success: false, error: 'Sin autenticación' };
      }

      const response = await fetch(`${API_BASE_URL}/query/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          table,
          data
        })
      });

      const result = await response.json();

      // Si es 401 (sin token), retornar error manejable
      if (response.status === 401) {
        console.log('⚠️ MySQL insert: Sin autenticación');
        return { success: false, error: 'Sin autenticación' };
      }

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error en la inserción');
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('Error en MySQL insert:', error);
      throw error;
    }
  }

  // Seleccionar registros
  async select(table, conditions = '', orderBy = '', limit = '') {
    try {
      const token = sessionStorage.getItem('token');

      // ✅ PERMITIR SELECT sin token para tablas públicas (posts, etc.)
      // Solo advertir si no hay token, pero continuar con la petición
      if (!token) {
        console.log('⚠️ MySQL select: Sin token, intentando consulta pública');
      }

      // Convertir conditions string a array de objetos where
      const where = [];
      if (conditions) {
        // Parsear condiciones simples como "user_id = 1 AND read_at IS NULL"
        const condParts = conditions.split(' AND ');
        condParts.forEach(cond => {
          cond = cond.trim();

          // Manejar IS NULL
          if (cond.includes('IS NULL')) {
            const field = cond.replace(/\s+IS\s+NULL/i, '').trim();
            where.push({ field, operator: 'IS', value: null });
          }
          // Manejar IS NOT NULL
          else if (cond.includes('IS NOT NULL')) {
            const field = cond.replace(/\s+IS\s+NOT\s+NULL/i, '').trim();
            where.push({ field, operator: 'IS NOT', value: null });
          }
          // Manejar operadores normales
          else {
            const match = cond.match(/(\w+)\s*(=|!=|>|<|>=|<=)\s*(.+)/);
            if (match) {
              where.push({
                field: match[1],
                operator: match[2],
                value: match[3].trim().replace(/['"]/g, '')
              });
            }
          }
        });
      }

      const body = {
        table,
        where,
        ...(orderBy && { order: { field: orderBy.split(' ')[0], ascending: !orderBy.includes('DESC') } }),
        ...(limit && { limit: parseInt(limit) })
      };

      const response = await fetch(`${API_BASE_URL}/query/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(body)
      });

      // Si es 401 (sin token), retornar array vacío ANTES de parsear JSON
      if (response.status === 401) {
        console.log('⚠️ MySQL select: Sin autenticación (esperado durante registro/login)');
        return [];
      }

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error en la consulta');
      }

      return result.data;
    } catch (error) {
      // Si es error de red o 401, retornar array vacío
      if (error.message.includes('401') || !navigator.onLine) {
        return [];
      }
      console.error('Error en MySQL select:', error);
      throw error;
    }
  }

  // Actualizar registro
  async update(table, data, conditions) {
    try {
      const token = sessionStorage.getItem('token');

      // Si no hay token, retornar error sin hacer petición
      if (!token) {
        console.log('⚠️ MySQL update: Sin token');
        return { success: false, error: 'Sin autenticación' };
      }

      const response = await fetch(`${API_BASE_URL}/query/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          table,
          data,
          conditions
        })
      });

      const result = await response.json();

      // Si es 401 (sin token), retornar error manejable
      if (response.status === 401) {
        console.log('⚠️ MySQL update: Sin autenticación');
        return { success: false, error: 'Sin autenticación' };
      }

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error en la actualización');
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('Error en MySQL update:', error);
      throw error;
    }
  }

  // Eliminar registro
  async delete(table, conditions) {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/query/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          table,
          conditions
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error en la eliminación');
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('Error en MySQL delete:', error);
      throw error;
    }
  }

  // Verificar conexión
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/test`);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ MySQL API no disponible');
      return false;
    }
  }
}

export const mysqlClient = new MySQLClient();
