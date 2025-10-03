import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Phone, Video, MoreVertical, Plus } from 'lucide-react';
import { apiClient, handleApiError } from '../utils/apiClient';

const ChatListScreen = ({ userProfile, socket, onChatSelect, onStartNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar chats del usuario
  const loadChats = async () => {
    try {
      setLoading(true);

      // Buscar chats donde el usuario sea participante 1 o 2
      const chatsResponse = await apiClient.get(`/chat_list_view?participant_1_id=${userProfile.id}&_sort=last_message_time&_order=desc`);
      let data = chatsResponse.data || [];

      // También buscar chats donde sea participant_2_id
      try {
        const chatsResponse2 = await apiClient.get(`/chat_list_view?participant_2_id=${userProfile.id}&_sort=last_message_time&_order=desc`);
        const data2 = chatsResponse2.data || [];
        data = [...data, ...data2];
      } catch (error2) {
        console.log('No se encontraron chats como participant_2_id');
      }

      if (data.length === 0) {
        setChats([]);
        return;
      }

      // Obtener información de los otros usuarios
      const otherUserIds = data.map(chat =>
        chat.participant_1_id === userProfile.id
          ? chat.participant_2_id
          : chat.participant_1_id
      );

      if (otherUserIds.length > 0) {
        const usersPromises = otherUserIds.map(async (userId) => {
          try {
            const userResponse = await apiClient.get(`/users/${userId}`);
            return userResponse.data;
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error);
            return null;
          }
        });

        const usersData = await Promise.all(usersPromises);
        const validUsersData = usersData.filter(user => user !== null);

        // Combinar datos de chats con datos de usuarios
        const chatsWithUsers = data.map(chat => {
          const otherUserId = chat.participant_1_id === userProfile.id
            ? chat.participant_2_id
            : chat.participant_1_id;

          const otherUser = validUsersData.find(user => user && user.id === otherUserId);
          const unreadCount = userProfile.id === chat.participant_1_id
            ? chat.unread_count_p1
            : chat.unread_count_p2;
          const isPinned = userProfile.id === chat.participant_1_id
            ? chat.is_pinned_by_p1
            : chat.is_pinned_by_p2;

          return {
            id: chat.chat_id,
            participant_1_id: chat.participant_1_id,
            participant_2_id: chat.participant_2_id,
            otherUser,
            lastMessage: {
              text: chat.last_message_text || 'Sin mensajes',
              timestamp: chat.last_message_time,
              sender: chat.last_message_sender_id === userProfile.id ? 'me' : 'them'
            },
            unreadCount,
            isPinned
          };
        });

        setChats(chatsWithUsers);
      } else {
        setChats([]);
      }

    } catch (error) {
      console.error('Error loading chats:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Effect para cargar chats iniciales
  useEffect(() => {
    loadChats();
  }, [userProfile.id]);

  // Effect para Socket.IO listeners
  useEffect(() => {
    if (socket?.onMessage) {
      socket.onMessage((messageData) => {
        // Recargar chats cuando llega un nuevo mensaje
        loadChats();
      });

      return () => {
        socket.offMessage();
      };
    }
  }, [socket]);

  // Filtrar chats por búsqueda
  const filteredChats = chats.filter(chat =>
    chat.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear tiempo del último mensaje
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Ahora';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Ayer';
      if (diffInDays < 7) return `${diffInDays}d`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  // Manejar clic en chat
  const handleChatClick = (chat) => {
    if (onChatSelect) {
      onChatSelect(chat);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Mensajes</h1>
          <button className="p-2 hover:bg-yellow-300/50 rounded-full transition-colors">
            <Plus className="w-5 h-5 text-slate-800" />
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className={`p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${
                  chat.isPinned ? 'border-l-4 border-yellow-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 text-lg font-bold overflow-hidden">
                      {chat.otherUser?.profile_photo_url ? (
                        <img
                          src={chat.otherUser.profile_photo_url}
                          alt={chat.otherUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{chat.otherUser?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                  </div>

                  {/* Contenido del chat */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {chat.otherUser?.name || 'Usuario desconocido'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="bg-yellow-500 text-slate-800 text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage.sender === 'me' && 'Tú: '}
                        {chat.lastMessage.text}
                      </p>

                      <div className="flex items-center space-x-1 ml-2">
                        <span className="text-xs text-gray-400 capitalize">
                          {chat.otherUser?.user_type === 'contractor' ? 'Contratista' : 'Trabajador'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron chats' : 'No tienes conversaciones'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'Intenta buscar con otro término'
                : 'Inicia una conversación aplicando a un trabajo o contactando a un trabajador'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatListScreen;