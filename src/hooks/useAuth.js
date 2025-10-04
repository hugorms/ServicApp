import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient, handleApiError } from '../utils/apiClient';
import { authClient } from '../utils/authClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Verificar sesión inicial desde sessionStorage y BD
    const checkSession = async () => {
      try {
        console.log('🔄 Verificando sesión inicial...');

        const token = sessionStorage.getItem('token');
        const userIdStr = sessionStorage.getItem('userId');

        if (token && userIdStr) {
          const userId = parseInt(userIdStr);
          console.log('✅ Token encontrado, obteniendo perfil desde BD...');

          // Obtener perfil completo desde la base de datos
          try {
            const { mysqlClient } = await import('../utils/mysqlClient');
            const users = await mysqlClient.select('users', `id = ${userId}`);

            if (users && users.length > 0) {
              const userData = users[0];
              console.log('✅ Perfil cargado desde BD:', userData);
              setUser(userData);
              setUserProfile(userData);
            } else {
              console.log('ℹ️ Usuario no encontrado en BD');
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('userId');
              setUser(null);
              setUserProfile(null);
            }
          } catch (dbError) {
            console.error('Error obteniendo perfil desde BD:', dbError);
            setUser(null);
            setUserProfile(null);
          }
        } else {
          console.log('ℹ️ No hay sesión activa');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('🚨 Error verificando sesión:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email, password) => {
    try {
      console.log('🔄 Iniciando sesión con:', { email });

      const response = await authClient.signIn({ email, password });
      const { user, session } = response;
      const token = session?.access_token || 'local_token_' + user.id;

      // Guardar solo token y userId en sessionStorage
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userId', user.id.toString());

      console.log('✅ Sesión iniciada, obteniendo datos desde BD...');

      // Obtener datos frescos desde BD
      const { mysqlClient } = await import('../utils/mysqlClient');
      const users = await mysqlClient.select('users', `id = ${user.id}`);

      if (users && users.length > 0) {
        const freshUserData = users[0];
        setUser(freshUserData);
        setUserProfile(freshUserData);
        return { data: { user: freshUserData }, error: null };
      } else {
        setUser(user);
        setUserProfile(user);
        return { data: { user }, error: null };
      }
    } catch (error) {
      console.error('🚨 Error en signIn:', error);
      return { data: null, error: { message: error.message || 'Error en el login' } };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      console.log('🔄 Registrando usuario con:', {
        email,
        name: userData.name,
        user_type: userData.user_type
      });

      const response = await authClient.signUp({
        email,
        password,
        name: userData.name,
        user_type: userData.user_type,
        phone: userData.phone || ''
      });

      const user = response.user;
      const token = response.session?.access_token || 'local_token_' + user.id;

      // Guardar solo token y userId en sessionStorage
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userId', user.id.toString());

      console.log('✅ Usuario registrado en MySQL:', user);
      setUser(user);
      setUserProfile(user);

      return { data: { user }, error: null };
    } catch (error) {
      console.error('🚨 Error en signUp:', error);
      return { data: null, error: { message: error.message || 'Error en el registro' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Cerrando sesión...');

      // Limpiar sessionStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userId');

      setUser(null);
      setUserProfile(null);

      console.log('✅ Sesión cerrada');
      return { error: null };
    } catch (error) {
      console.error('🚨 Error en signOut:', error);
      return { error };
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      console.log('🔄 Obteniendo perfil de usuario desde BD:', userId);

      const { mysqlClient } = await import('../utils/mysqlClient');
      const users = await mysqlClient.select('users', `id = ${userId}`);

      if (users && users.length > 0) {
        const userData = users[0];
        console.log('✅ Perfil encontrado desde BD:', userData);
        setUserProfile(userData);
        setUser(userData);
      } else {
        console.log('ℹ️ Perfil no encontrado en BD');
        setUserProfile('NOT_FOUND');
      }
    } catch (error) {
      console.error('🚨 Error en fetchUserProfile:', error);
      setUserProfile('NOT_FOUND');
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { email });
      return { data: response.data, error: null };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { data: null, error: { message: errorMessage } };
    }
  };

  const updatePassword = async (newPassword, token) => {
    try {
      const response = await apiClient.post('/auth/update-password', {
        password: newPassword,
        token
      });
      return { data: response.data, error: null };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { data: null, error: { message: errorMessage } };
    }
  };

  const updateProfile = async () => {
    if (userProfile && userProfile.id) {
      await fetchUserProfile(userProfile.id);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    fetchUserProfile,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
