const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.API_PORT || 3009;
const JWT_SECRET = process.env.JWT_SECRET || 'servicios_app_secret_key_2025';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3500', 'http://localhost:4000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'servicios_app',
  port: 3306
};

// Pool de conexiones MySQL
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Ruta de prueba
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    res.json({
      message: 'API MySQL funcionando',
      database: 'servicios_app',
      test: rows[0].test
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name, user_type, ...otherData } = req.body;

  try {
    // Verificar si el email ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(422).json({
        error: 'User already registered',
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await pool.execute(
      `INSERT INTO users (email, password, name, user_type) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, name, user_type]
    );

    const userId = result.insertId;

    // Generar JWT
    const token = jwt.sign(
      { id: userId, email, user_type },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: userId,
        email,
        name,
        user_type
      },
      session: {
        access_token: token,
        user: { id: userId, email, name, user_type }
      },
      error: null
    });

  } catch (error) {
    console.error('Error en signup:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('🔐 Intento de login:', email);

    // Validar que se enviaron credenciales
    if (!email || !password) {
      console.log('❌ Faltan credenciales');
      return res.status(400).json({
        error: 'Invalid login credentials',
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(400).json({
        error: 'Invalid login credentials',
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];
    console.log('✅ Usuario encontrado:', user.id, user.name);

    // Verificar que la contraseña del usuario existe
    if (!user.password) {
      console.log('❌ Usuario sin contraseña en BD:', user.id);
      return res.status(500).json({
        error: 'Database error',
        message: 'Error en la configuración del usuario'
      });
    }

    // Verificar contraseña
    console.log('🔐 Comparando contraseñas...');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(400).json({
        error: 'Invalid login credentials',
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ Contraseña válida');

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remover password del objeto user
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ Login exitoso:', user.email);

    res.json({
      user: userWithoutPassword,
      session: {
        access_token: token,
        user: userWithoutPassword
      },
      error: null
    });

  } catch (error) {
    console.error('❌ Error 500 en signin:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/auth/signout', (req, res) => {
  // Para JWT, el logout es del lado del cliente
  res.json({ error: null });
});

app.get('/api/auth/session', verifyToken, async (req, res) => {
  try {
    // Obtener datos actuales del usuario
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ session: null });
    }

    const { password: _, ...user } = users[0];

    res.json({
      session: {
        user,
        access_token: req.headers.authorization?.replace('Bearer ', '')
      }
    });

  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    res.status(500).json({ error: error.message });
  }
});

// USERS TABLE OPERATIONS
app.get('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ data: null, error: 'Usuario no encontrado' });
    }

    const { password: _, ...user } = users[0];
    res.json({ data: user, error: null });

  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// UPDATE USER PROFILE
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    console.log('🔄 Actualizando perfil de usuario:', userId);
    console.log('📝 Datos recibidos:', Object.keys(updateData));

    // Verificar que el usuario existe
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ data: null, error: 'Usuario no encontrado' });
    }

    // Preparar los campos a actualizar
    const allowedFields = [
      'name', 'phone', 'address', 'profession', 'professions', 'specialties', 'identity_card',
      'experience_years', 'description', 'company_name', 'company_type',
      'company_description', 'location_urbanization', 'location_condominium',
      'location_apartment_floor', 'location_apartment_number', 'location_house_number',
      'location_quinta_number', 'notification_preferences', 'profile_photo_url',
      'identity_card_url', 'portfolio_urls', 'company_logo_url', 'business_license_url',
      'id_scan_front_url', 'id_scan_back_url', 'facial_scan_url', 'profile_completed',
      'user_type'
    ];

    const updateFields = [];
    const updateValues = [];

    // Construir la query dinámicamente solo con los campos enviados
    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        // Convertir arrays y objetos a JSON
        if (Array.isArray(updateData[field]) || typeof updateData[field] === 'object') {
          updateValues.push(JSON.stringify(updateData[field]));
        } else {
          updateValues.push(updateData[field]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ data: null, error: 'No hay campos válidos para actualizar' });
    }

    // Agregar timestamp de actualización
    updateFields.push('created_at = created_at'); // Mantener created_at original

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);

    console.log('🔄 Ejecutando SQL:', sql);

    await pool.execute(sql, updateValues);

    // Obtener el usuario actualizado
    const [updatedUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const { password: _, ...userWithoutPassword } = updatedUser[0];

    console.log('✅ Perfil actualizado exitosamente');
    res.json({
      data: userWithoutPassword,
      error: null,
      message: 'Perfil actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(500).json({ data: null, error: error.message });
  }
});

// GENERIC QUERY ENDPOINT - SIN TOKEN para consultas públicas de posts
app.post('/api/query/select', async (req, res) => {
  const { table, select = '*', where = [], order = null, limit = null } = req.body;

  try {
    let sql = `SELECT ${select} FROM ${table}`;
    const params = [];

    // WHERE clauses
    if (where.length > 0) {
      const whereClause = where.map(condition => {
        // Manejar IN operator
        if (condition.operator === 'IN') {
          params.push(...condition.value);
          return `${condition.field} IN (${condition.value.map(() => '?').join(', ')})`;
        }
        // Manejar IS NULL / IS NOT NULL
        else if (condition.operator === 'IS' || condition.operator === 'IS NOT') {
          if (condition.value === null) {
            return `${condition.field} ${condition.operator} NULL`;
          }
          return `${condition.field} ${condition.operator} ?`;
        }
        // Operadores normales
        else {
          params.push(condition.value);
          return `${condition.field} ${condition.operator} ?`;
        }
      }).join(' AND ');

      sql += ` WHERE ${whereClause}`;
    }

    // ORDER BY
    if (order) {
      sql += ` ORDER BY ${order.field} ${order.ascending ? 'ASC' : 'DESC'}`;
    }

    // LIMIT
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const [rows] = await pool.execute(sql, params);
    res.json({ data: rows, error: null });

  } catch (error) {
    console.error('Error en SELECT:', error);
    res.status(500).json({ data: null, error: error.message });
  }
});

app.post('/api/query/insert', verifyToken, async (req, res) => {
  const { table, data } = req.body;

  try {
    const records = Array.isArray(data) ? data : [data];
    const results = [];

    for (const record of records) {
      const fields = Object.keys(record);
      const values = Object.values(record);
      const placeholders = fields.map(() => '?').join(', ');

      const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await pool.execute(sql, values);

      results.push({
        id: result.insertId,
        affectedRows: result.affectedRows
      });
    }

    res.json({ data: results, error: null });

  } catch (error) {
    console.error('Error en INSERT:', error);
    res.status(500).json({ data: null, error: error.message });
  }
});


// UPDATE - Actualizar registros
app.put('/api/query/update', verifyToken, async (req, res) => {
  const { table, data, conditions } = req.body;

  try {
    // Construir SET clause
    const setFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const setValues = Object.values(data);

    // Construir WHERE clause desde conditions string
    // Ejemplo: "id = 5" o "user_id = 10 AND status = 'active'"
    let whereSql = conditions || '1=1';

    const sql = `UPDATE ${table} SET ${setFields} WHERE ${whereSql}`;

    const [result] = await pool.execute(sql, setValues);

    res.json({
      success: true,
      data: {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      },
      error: null
    });

  } catch (error) {
    console.error('Error en UPDATE:', error);
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// DELETE - Eliminar registros
app.delete('/api/query/delete', verifyToken, async (req, res) => {
  const { table, conditions } = req.body;

  try {
    // Construir WHERE clause desde conditions string
    // Ejemplo: "id = 5" o "user_id = 10 AND status = 'active'"
    let whereSql = conditions || '1=1';

    const sql = `DELETE FROM ${table} WHERE ${whereSql}`;

    const [result] = await pool.execute(sql);

    res.json({
      success: true,
      data: {
        affectedRows: result.affectedRows
      },
      error: null
    });

  } catch (error) {
    console.error('Error en DELETE:', error);
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});
// POST APPLICATIONS ENDPOINTS
app.get('/api/post_applications', verifyToken, async (req, res) => {
  const { worker_id, status, contractor_id } = req.query;

  try {
    let sql = 'SELECT * FROM post_applications';
    const params = [];
    const conditions = [];

    if (worker_id) {
      conditions.push('worker_id = ?');
      params.push(worker_id);
    }

    if (contractor_id) {
      conditions.push('contractor_id = ?');
      params.push(contractor_id);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json({ data: rows, error: null });

  } catch (error) {
    console.error('Error en post_applications:', error);
    res.status(500).json({ data: null, error: error.message });
  }
});

app.post('/api/post_applications', verifyToken, async (req, res) => {
  const { post_id, worker_id, contractor_id, message, status = 'pending' } = req.body;

  try {
    // Verificar si ya existe una aplicación
    const [existing] = await pool.execute(
      'SELECT id FROM post_applications WHERE post_id = ? AND worker_id = ?',
      [post_id, worker_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        data: null,
        error: 'Ya has aplicado a este trabajo'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO post_applications (post_id, worker_id, contractor_id, message, status) VALUES (?, ?, ?, ?, ?)',
      [post_id, worker_id, contractor_id, message, status]
    );

    res.json({
      data: { id: result.insertId, post_id, worker_id, contractor_id, message, status },
      error: null
    });

  } catch (error) {
    console.error('Error creando aplicación:', error);
    res.status(500).json({ data: null, error: error.message });
  }
});

app.put('/api/post_applications/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.execute(
      'UPDATE post_applications SET status = ? WHERE id = ?',
      [status, id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM post_applications WHERE id = ?',
      [id]
    );

    res.json({ data: updated[0], error: null });

  } catch (error) {
    console.error('Error actualizando aplicación:', error);
    res.status(500).json({ data: null, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API MySQL corriendo en puerto ${PORT}`);
  console.log(`📊 Base de datos: ${dbConfig.database}`);
  console.log(`🔗 Endpoints disponibles:`);
  console.log(`   GET  /api/test`);
  console.log(`   POST /api/auth/signup`);
  console.log(`   POST /api/auth/signin`);
  console.log(`   GET  /api/auth/session`);
  console.log(`   GET  /api/post_applications`);
  console.log(`   POST /api/post_applications`);
  console.log(`   PUT  /api/post_applications/:id`);
});

module.exports = app;
// ============================================================================
// GEOCODING PROXY (para evitar CORS y User-Agent issues)
// ============================================================================

// Geocoding search (dirección → coordenadas)
app.get('/api/geocode/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ve`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ServicApp/1.0 (Contact: support@servicapp.com)'
      }
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error en geocoding search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reverse geocoding (coordenadas → dirección)
app.get('/api/geocode/reverse', async (req, res) => {
  const { lat, lon } = req.query;
  
  if (!lat || !lon) {
    return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ServicApp/1.0 (Contact: support@servicapp.com)'
      }
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error en reverse geocoding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

console.log('✅ Geocoding proxy endpoints agregados');
