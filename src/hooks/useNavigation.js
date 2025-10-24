import { useState, useCallback } from 'react';

export const useNavigation = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigateToTab = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []);

  const getTabConfig = (userType) => {
    if (userType === 'contractor') {
      return [
        { id: 'dashboard', label: 'Inicio', icon: 'Home' },
        { id: 'posts', label: 'Posts', icon: 'FileText' },
        { id: 'chat', label: 'Mensajes', icon: 'MessageCircle' },
        { id: 'profile', label: 'Perfil', icon: 'User' }
      ];
    } else {
      return [
        { id: 'dashboard', label: 'Inicio', icon: 'Home' },
        { id: 'projects', label: 'Proyectos', icon: 'Briefcase' },
        { id: 'services', label: 'Servicios', icon: 'Search' },
        { id: 'chat', label: 'Mensajes', icon: 'MessageCircle' },
        { id: 'profile', label: 'Perfil', icon: 'User' }
      ];
    }
  };

  return {
    activeTab,
    setActiveTab,
    navigateToTab,
    getTabConfig
  };
};
export default useNavigation;
