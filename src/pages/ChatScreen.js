import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip, Phone, Video, MoreVertical, Image, Smile } from 'lucide-react';
import { apiClient, handleApiError } from '../utils/apiClient';

const ChatScreen = ({ userProfile, socket, chatId, otherUser, onGoBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar mensajes del chat
  const loadMessages = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get(`/messages/${chatId}`);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error loading messages:', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Effect para cargar mensajes iniciales
  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  // Effect para Socket.IO listeners
  useEffect(() => {
    if (socket?.onMessage) {
      socket.onMessage((messageData) => {
        // Solo agregar mensajes de este chat específico
        if (messageData.chat_id === chatId) {
          setMessages(prev => [...prev, messageData]);
        }
      });

      return () => {
        socket.offMessage();
      };
    }
  }, [socket, chatId]);

  // Marcar mensajes como leídos
  const markMessagesAsRead = async () => {
    try {
      await apiClient.put(`/messages/${chatId}/mark-read`, {
        sender_id: otherUser.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', handleApiError(error));
    }
  };

  // Effect para marcar mensajes como leídos
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      markMessagesAsRead();
    }
  }, [messages, loading, chatId, otherUser?.id]);

  // Enviar mensaje
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData = {
        chat_id: chatId,
        sender_id: userProfile.id,
        message_text: newMessage.trim(),
        message_type: 'text',
        read_by_recipient: false
      };

      const response = await apiClient.post('/messages', messageData);
      const data = response.data;

      // Agregar mensaje localmente
      setMessages(prev => [...prev, data]);

      // Limpiar campo de texto
      setNewMessage('');

      // Emitir mensaje via Socket.IO si está disponible
      if (socket?.emit) {
        socket.emit('new_message', {
          ...data,
          recipient_id: otherUser.id
        });
      }
    } catch (error) {
      console.error('Error sending message:', handleApiError(error));
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  // Manejar envío con Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formatear fecha del mensaje
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header del chat */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoBack}
              className="p-2 hover:bg-yellow-300/50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-800" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 text-lg font-bold overflow-hidden">
                {otherUser?.profile_photo_url ? (
                  <img
                    src={otherUser.profile_photo_url}
                    alt={otherUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{otherUser?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                )}
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  {otherUser?.name || 'Usuario'}
                </h1>
                <p className="text-sm text-slate-600 capitalize">
                  {otherUser?.user_type === 'contractor' ? 'Contratista' : 'Trabajador'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button className="p-2 hover:bg-yellow-300/50 rounded-full transition-colors">
              <Phone className="w-5 h-5 text-slate-800" />
            </button>
            <button className="p-2 hover:bg-yellow-300/50 rounded-full transition-colors">
              <Video className="w-5 h-5 text-slate-800" />
            </button>
            <button className="p-2 hover:bg-yellow-300/50 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-800" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inicia la conversación
            </h3>
            <p className="text-gray-500 max-w-sm">
              Envía un mensaje para comenzar a chatear con {otherUser?.name}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === userProfile.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender_id === userProfile.id
                      ? 'bg-yellow-500 text-slate-800'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.message_text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === userProfile.id
                        ? 'text-slate-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                    {message.sender_id === userProfile.id && (
                      <span className="ml-1">
                        {message.read_by_recipient ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input de mensaje */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-500 hover:text-yellow-600 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>

          <button className="p-2 text-gray-500 hover:text-yellow-600 transition-colors">
            <Image className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="w-full px-4 py-2 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white resize-none"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '100px' }}
            />
          </div>

          <button className="p-2 text-gray-500 hover:text-yellow-600 transition-colors">
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-yellow-500 text-slate-800 rounded-full hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;