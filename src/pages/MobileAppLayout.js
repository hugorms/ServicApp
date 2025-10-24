import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { useSocket } from '../hooks/useSocket';
import TabNavigation from '../components/AppLayout/TabNavigation';
import MainContent from '../components/AppLayout/MainContent';

// Importar las páginas/componentes principales
import PanelContratista from './PanelContratista';
import PanelTrabajador from './PanelTrabajador';
import ProyectosTrabajador from './ProyectosTrabajador';
import MisPublicaciones from './MisPublicaciones';
import EncuentraServicios from './EncuentraServicios';
import ChatContainer from '../components/ChatContainer';
import ProfileScreen from './ProfileScreen';

const MobileAppLayout = () => {
  const { userProfile, signOut } = useAuth();
  const { activeTab, navigateToTab, getTabConfig } = useNavigation();
  const socket = useSocket(userProfile?.id);

  const handleGoHome = () => {
    navigateToTab('dashboard');
  };

  // Función para navegar a una publicación desde notificaciones
  const handleNavigateToPost = (postId, notificationType) => {
    console.log(`🔔 Navegando a post ${postId} por notificación tipo: ${notificationType}`);

    // Si es trabajador y es notificación de nuevo trabajo, ir a "Encuentra Servicios"
    if (userProfile.user_type === 'worker' && notificationType === 'new_job') {
      navigateToTab('services');
      // Aquí podrías agregar lógica adicional para abrir el modal específico
      setTimeout(() => {
        // Disparar evento personalizado para que EncuentraServicios abra el modal
        window.dispatchEvent(new CustomEvent('openPostFromNotification', {
          detail: { postId, notificationType }
        }));
      }, 100);
    }
    // Si es contratista, ir al dashboard (aplicaciones)
    else if (userProfile.user_type === 'contractor' && notificationType === 'application') {
      navigateToTab('dashboard');
    }
    // Para otros casos, ir al dashboard por defecto
    else {
      navigateToTab('dashboard');
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const tabs = getTabConfig(userProfile.user_type);

  const renderContent = () => {
    const commonProps = {
      userProfile,
      socket,
      onNavigateToPost: handleNavigateToPost
    };

    switch (activeTab) {
      case 'dashboard':
        return userProfile.user_type === 'contractor'
          ? <PanelContratista {...commonProps} />
          : <PanelTrabajador {...commonProps} />;

      case 'services':
        // Trabajadores ven problemas publicados para aplicar
        return <EncuentraServicios {...commonProps} />;

      case 'projects':
        // Proyectos activos del trabajador
        return <ProyectosTrabajador {...commonProps} />;

      case 'posts':
        // Contratistas gestionan sus publicaciones
        return <MisPublicaciones {...commonProps} />;

      case 'chat':
        return <ChatContainer {...commonProps} />;

      case 'profile':
        return <ProfileScreen {...commonProps} onSignOut={signOut} onGoHome={handleGoHome} />;

      default:
        return <div className="p-4">Página no encontrada</div>;
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto">
        <MainContent activeTab={activeTab}>
          <div className="pb-96">
            {renderContent()}
          </div>
        </MainContent>
      </div>
      
      {/* Tab de navegación en el fondo */}
      <div className="bg-white border-t border-gray-200 relative z-[100]" style={{minHeight: '64px'}}>
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={navigateToTab}
        />
      </div>
    </div>
  );
};

export default MobileAppLayout;