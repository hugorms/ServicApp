const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:4000", "http://localhost:4001"],
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:4000", "http://localhost:4001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Almacenar usuarios conectados
const connectedUsers = new Map();
const userRooms = new Map();

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Registro de usuario
  socket.on('register_user', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`Usuario ${userId} registrado con socket ${socket.id}`);
    
    // Notificar a otros usuarios que este usuario está en línea
    socket.broadcast.emit('user_online', userId);
    
    // Enviar lista de usuarios en línea
    const onlineUsers = Array.from(connectedUsers.keys());
    io.emit('online_users', onlineUsers);
  });

  // Obtener usuarios en línea
  socket.on('get_online_users', () => {
    const onlineUsers = Array.from(connectedUsers.keys());
    socket.emit('online_users', onlineUsers);
  });

  // ===== MANEJO DE MENSAJES =====
  socket.on('send_message', (data) => {
    const { receiverId, message, senderId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      // Enviar mensaje al receptor
      io.to(receiverSocketId).emit('new_message', {
        senderId,
        message,
        timestamp: new Date().toISOString()
      });
      
      // Confirmar al emisor
      socket.emit('message_delivered', { receiverId, messageId: data.messageId || Date.now() });
    }
  });

  // Indicar que está escribiendo
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Unirse a un chat
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    userRooms.set(socket.userId, `chat_${chatId}`);
    console.log(`Usuario ${socket.userId} se unió al chat ${chatId}`);
  });

  // Salir de un chat
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    userRooms.delete(socket.userId);
    console.log(`Usuario ${socket.userId} salió del chat ${chatId}`);
  });

  // ===== MANEJO DE SOLICITUDES DE TRABAJO =====
  
  // Aplicar a un trabajo
  socket.on('apply_to_job', (data) => {
    const { postId, contractorId, workerId } = data;
    const contractorSocketId = connectedUsers.get(contractorId);
    
    if (contractorSocketId) {
      io.to(contractorSocketId).emit('new_job_application', {
        postId,
        workerId,
        contractorId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Confirmar al trabajador que aplicó
    socket.emit('application_sent_confirmation', {
      postId,
      contractorId,
      timestamp: new Date().toISOString()
    });
  });

  // Aceptar solicitud de trabajo
  socket.on('accept_job_request', (data) => {
    const { postId, workerId, contractorId } = data;
    const workerSocketId = connectedUsers.get(workerId);
    
    if (workerSocketId) {
      io.to(workerSocketId).emit('application_status_updated', {
        applicationId: `${postId}_${workerId}`,
        postId,
        workerId,
        contractorId,
        status: 'accepted',
        timestamp: new Date().toISOString()
      });
    }
    
    // Notificar a otros usuarios que el post puede haber cambiado
    io.emit('post_status_updated', {
      postId,
      status: 'in_progress',
      timestamp: new Date().toISOString()
    });
  });

  // Rechazar solicitud de trabajo
  socket.on('reject_job_request', (data) => {
    const { postId, workerId, contractorId } = data;
    const workerSocketId = connectedUsers.get(workerId);
    
    if (workerSocketId) {
      io.to(workerSocketId).emit('application_status_updated', {
        applicationId: `${postId}_${workerId}`,
        postId,
        workerId,
        contractorId,
        status: 'rejected',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Actualizar estado de post
  socket.on('update_post_status', (data) => {
    const { postId, status, userId } = data;
    
    // Si es un post nuevo creado, notificar a todos los trabajadores
    if (status === 'created') {
      // Emitir a todos los usuarios excepto al creador
      socket.broadcast.emit('new_post_created', {
        postId,
        createdBy: userId,
        timestamp: new Date().toISOString()
      });
    } else {
      // Para otros cambios de estado, emitir a todos
      io.emit('post_status_updated', {
        postId,
        status,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ===== MANEJO DE NOTIFICACIONES =====
  
  socket.on('send_notification', (data) => {
    const { targetUserId, notification, fromUserId } = data;
    const targetSocketId = connectedUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('notification_received', {
        ...notification,
        fromUserId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ===== DESCONEXIÓN =====
  
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      userRooms.delete(socket.userId);
      
      // Notificar a otros usuarios que este usuario se desconectó
      socket.broadcast.emit('user_offline', socket.userId);
      
      // Actualizar lista de usuarios en línea
      const onlineUsers = Array.from(connectedUsers.keys());
      io.emit('online_users', onlineUsers);
    }
  });

  // Manejo de errores
  socket.on('error', (error) => {
    console.error(`Error en socket ${socket.id}:`, error);
  });
});

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Servidor Socket.IO ejecutándose en puerto ${PORT}`);
  console.log(`📡 Esperando conexiones desde http://localhost:3000`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('Error del servidor:', error);
});

process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor Socket.IO...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});