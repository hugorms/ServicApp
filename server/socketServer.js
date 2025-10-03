class SocketServer {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.userRooms = new Map();
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        const port = 3700;
        this.io = require('socket.io')(port, {
          cors: {
            origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3500", "http://localhost:3600", "http://localhost:3700", "http://localhost:4000"],
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type"],
            credentials: true
          }
        });

        console.log(`🚀 Servidor Socket.IO iniciado en puerto ${port}`);

        this.setupEventHandlers();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 Usuario conectado: ${socket.id}`);

      // Usuario se registra
      socket.on('register-user', (userId) => {
        this.connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        
        console.log(`✅ Usuario registrado: ${userId} (${socket.id})`);
        
        // Emitir lista de usuarios online a todos
        this.io.emit('online-users', Array.from(this.connectedUsers.keys()));
      });

      // Unirse a un chat
      socket.on('join-chat', (chatId) => {
        socket.join(chatId);
        
        // Guardar salas del usuario
        if (!this.userRooms.has(socket.userId)) {
          this.userRooms.set(socket.userId, new Set());
        }
        this.userRooms.get(socket.userId).add(chatId);
        
        console.log(`📱 Usuario ${socket.userId} se unió al chat ${chatId}`);
      });

      // Salir de un chat
      socket.on('leave-chat', (chatId) => {
        socket.leave(chatId);
        
        if (this.userRooms.has(socket.userId)) {
          this.userRooms.get(socket.userId).delete(chatId);
        }
        
        console.log(`👋 Usuario ${socket.userId} salió del chat ${chatId}`);
      });

      // Enviar mensaje
      socket.on('send-message', (messageData) => {
        console.log(`💬 Mensaje de ${socket.userId} en chat ${messageData.chatId}`);
        
        // Emitir mensaje a todos en el chat excepto el remitente
        socket.to(messageData.chatId).emit('new-message', {
          ...messageData,
          timestamp: new Date().toISOString()
        });
      });

      // Usuario escribiendo
      socket.on('typing', ({ chatId, isTyping }) => {
        socket.to(chatId).emit('user-typing', {
          userId: socket.userId,
          isTyping
        });
      });

      // Actualizar presencia
      socket.on('update-presence', (status) => {
        // Emitir cambio de presencia a contactos
        if (this.userRooms.has(socket.userId)) {
          this.userRooms.get(socket.userId).forEach(chatId => {
            socket.to(chatId).emit('presence-update', {
              userId: socket.userId,
              status
            });
          });
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        console.log(`👋 Usuario desconectado: ${socket.id}`);
        
        if (socket.userId) {
          // Remover de usuarios conectados
          this.connectedUsers.delete(socket.userId);
          this.userRooms.delete(socket.userId);
          
          // Emitir lista actualizada de usuarios online
          this.io.emit('online-users', Array.from(this.connectedUsers.keys()));
          this.io.emit('user-disconnected', socket.userId);
        }
      });
    });

    // Manejar cierre del servidor
    process.on('SIGINT', () => {
      console.log('\n🛑 Cerrando servidor Socket.IO...');
      if (this.io) {
        this.io.close(() => {
          console.log('✅ Servidor Socket.IO cerrado');
          process.exit(0);
        });
      }
    });
  }
}

module.exports = SocketServer;

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
  const server = new SocketServer();
  server.start()
    .then(() => {
      console.log('✅ Socket.IO Server listo');
    })
    .catch((error) => {
      console.error('❌ Error iniciando Socket.IO:', error);
      process.exit(1);
    });
}