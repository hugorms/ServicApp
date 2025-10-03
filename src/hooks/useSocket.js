import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3700';

export const useSocket = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Crear conexión socket
    socketRef.current = io(SOCKET_URL, {
      query: { userId }
    });

    const socket = socketRef.current;

    // Event listeners
    socket.on('connect', () => {
      console.log('Socket conectado');
      setIsConnected(true);
      
      // Register user with server
      socket.emit('register_user', userId);
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
      setIsConnected(false);
    });

    socket.on('online_users', (users) => {
      setOnlineUsers(new Set(users));
    });

    socket.on('user_online', (connectedUserId) => {
      setOnlineUsers(prev => new Set([...prev, connectedUserId]));
    });

    socket.on('user_offline', (disconnectedUserId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(disconnectedUserId);
        return newSet;
      });
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId]);

  // Funciones para enviar eventos
  const joinChat = (chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_chat', chatId);
    }
  };

  const sendMessage = (messageData) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    }
  };

  const updatePresence = (status) => {
    if (socketRef.current) {
      socketRef.current.emit('update-presence', status);
    }
  };

  // Suscribirse a eventos
  const onMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
    }
  };

  const onTyping = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
    }
  };

  const offMessage = () => {
    if (socketRef.current) {
      socketRef.current.off('new_message');
    }
  };

  const offTyping = () => {
    if (socketRef.current) {
      socketRef.current.off('user_typing');
    }
  };

  return {
    isConnected,
    onlineUsers,
    joinChat,
    leaveChat,
    sendMessage,
    updatePresence,
    onMessage,
    onTyping,
    offMessage,
    offTyping
  };
};