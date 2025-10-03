import React, { useState, useEffect } from 'react';
import ChatListScreen from '../pages/ChatListScreen';
import ChatScreen from '../pages/ChatScreen';
import { apiClient, handleApiError } from '../utils/apiClient';

const ChatContainer = ({ userProfile, socket }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'chat'
  const [activeChat, setActiveChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  // Función para abrir un chat específico
  const openChat = async (chatData) => {
    try {
      // Determinar el otro usuario en la conversación
      const otherUserId = chatData.participant_1_id === userProfile.id
        ? chatData.participant_2_id
        : chatData.participant_1_id;

      // Obtener datos del otro usuario
      const userResponse = await apiClient.get(`/users/${otherUserId}?fields=id,name,user_type,profile_photo_url,phone`);
      const userData = userResponse.data;

      if (!userData) {
        console.error('Error fetching other user: Usuario no encontrado');
        return;
      }

      setOtherUser(userData);
      setActiveChat(chatData);
      setCurrentView('chat');

    } catch (error) {
      console.error('Error opening chat:', error);
      handleApiError(error);
    }
  };

  // Función para crear un nuevo chat
  const startNewChat = async (otherUserId, postId = null) => {
    try {
      // Crear o obtener el chat
      const chatResponse = await apiClient.post('/chats/get-or-create', {
        user1_id: userProfile.id,
        user2_id: otherUserId,
        post_id: postId
      });

      const chatData = chatResponse.data;

      if (!chatData) {
        console.error('Error creating/getting chat: No se pudo crear el chat');
        return;
      }

      await openChat(chatData);

    } catch (error) {
      console.error('Error starting new chat:', error);
      handleApiError(error);
    }
  };

  // Función para volver a la lista de chats
  const goBackToList = () => {
    setCurrentView('list');
    setActiveChat(null);
    setOtherUser(null);
  };

  // Renderizar vista actual
  if (currentView === 'chat' && activeChat && otherUser) {
    return (
      <ChatScreen
        userProfile={userProfile}
        socket={socket}
        chatId={activeChat.id}
        otherUser={otherUser}
        onGoBack={goBackToList}
      />
    );
  }

  return (
    <ChatListScreen
      userProfile={userProfile}
      socket={socket}
      onChatSelect={openChat}
      onStartNewChat={startNewChat}
    />
  );
};

export default ChatContainer;