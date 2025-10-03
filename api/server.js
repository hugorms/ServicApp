const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3600;

// Middleware
app.use(cors({
  origin: ['http://localhost:3500', 'http://localhost:3600', 'http://localhost:3700', 'http://localhost:4000'],
  credentials: true
}));
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'servicapp'
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'servicapp-secret-key-2025';

// Database connection pool
let pool;

async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('🔗 Conectado a MySQL correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    process.exit(1);
  }
}

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ServicApp API funcionando' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre, role, telefono } = req.body;

    // Validar campos requeridos
    if (!email || !password || !nombre || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, nombre, role, telefono, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [email, hashedPassword, nombre, role, telefono || null]
    );

    // Crear token
    const token = jwt.sign(
      { userId: result.insertId, email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar usuario sin password
    const user = {
      id: result.insertId,
      email,
      nombre,
      role,
      telefono
    };

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Crear token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login exitoso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, nombre, role, telefono, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Posts routes
app.get('/api/posts', async (req, res) => {
  try {
    const [posts] = await pool.execute(`
      SELECT p.*, u.nombre as user_name, u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({ data: posts });
  } catch (error) {
    console.error('Error obteniendo posts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, urgencia, ubicacion } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título y descripción son requeridos' });
    }

    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, title, description, category, urgencia, ubicacion, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [req.user.userId, title, description, category || null, urgencia || 'media', ubicacion || null]
    );

    res.status(201).json({
      message: 'Post creado exitosamente',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error creando post:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Messages routes
app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    const [messages] = await pool.execute(`
      SELECT m.*, u.nombre as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `, [chatId]);

    res.json({ data: messages });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { chat_id, content, receiver_id } = req.body;

    if (!chat_id || !content) {
      return res.status(400).json({ error: 'Chat ID y contenido son requeridos' });
    }

    const [result] = await pool.execute(
      'INSERT INTO messages (chat_id, sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
      [chat_id, req.user.userId, receiver_id, content]
    );

    res.status(201).json({
      message: 'Mensaje enviado exitosamente',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// User profile routes
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, email, nombre, role, telefono, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ data: users[0] });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor API iniciado en puerto ${PORT}`);
      console.log(`📱 API disponible en http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();