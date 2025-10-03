import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient, handleApiError, getCurrentUser, signOut as apiSignOut } from '../utils/apiClient';
import { authClient } from '../utils/authClient';

const AuthContext = createContext({});

// Función para arreglar perfiles incompletos de TODOS los usuarios
const fixIncompleteProfile = (user) => {
  if (!user || !user.user_type) return user;

  let needsUpdate = false;
  const updatedUser = { ...user };

  // Para CONTRATISTAS: verificar campos requeridos
  if (user.user_type === 'contractor') {
    // Si falta company_name, usar el nombre del usuario
    if (!updatedUser.company_name || updatedUser.company_name === null) {
      updatedUser.company_name = `Empresa ${user.name}`;
      needsUpdate = true;
    }

    // Si falta phone, generar uno ejemplo
    if (!updatedUser.phone || updatedUser.phone === '') {
      updatedUser.phone = '+58 412-0000000'; // Placeholder
      needsUpdate = true;
    }

    // Marcar perfil como completado
    if (!updatedUser.profile_completed) {
      updatedUser.profile_completed = true;
      needsUpdate = true;
    }

    // Agregar ubicación si falta
    if (!updatedUser.location_urbanization) {
      updatedUser.location_urbanization = 'Caracas';
      updatedUser.location_sector = 'Centro';
      needsUpdate = true;
    }
  }

  // Para TRABAJADORES: verificar campos requeridos
  if (user.user_type === 'worker') {
    // Si falta phone, generar uno ejemplo
    if (!updatedUser.phone || updatedUser.phone === '') {
      updatedUser.phone = '+58 424-0000000'; // Placeholder
      needsUpdate = true;
    }

    // Marcar perfil como completado
    if (!updatedUser.profile_completed) {
      updatedUser.profile_completed = true;
      needsUpdate = true;
    }

    // Agregar ubicación si falta
    if (!updatedUser.location_urbanization) {
      updatedUser.location_urbanization = 'Caracas';
      updatedUser.location_sector = 'Centro';
      needsUpdate = true;
    }

    // Agregar especialidades básicas si faltan
    if (!updatedUser.specialties || updatedUser.specialties.length === 0) {
      updatedUser.specialties = ['Servicios Generales'];
      needsUpdate = true;
    }
  }

  return needsUpdate ? updatedUser : user;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Verificar sesión inicial
    const checkSession = async () => {
      try {
        console.log('🔄 Verificando sesión inicial...');

        const token = localStorage.getItem('token');
        if (token) {
          // Verificar si el token es válido
          const userData = getCurrentUser();
          if (userData) {
            console.log('✅ Sesión encontrada:', userData);
            setUser(userData);
            setUserProfile(userData);
          } else {
            console.log('ℹ️ Token inválido, limpiando sesión');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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

      // Intentar con authClient primero
      try {
        const response = await authClient.signIn({ email, password });

        const { user, session } = response;
        const token = session?.access_token || 'local_token_' + user.id;

        // Guardar token y usuario en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Sesión iniciada en MySQL:', user);

        // Verificar si es un usuario que ya se registró antes pero le faltan datos
        const fixedUser = fixIncompleteProfile(user);

        if (fixedUser !== user) {
          console.log('🔧 Usuario actualizado con datos faltantes:', fixedUser);
          localStorage.setItem('user', JSON.stringify(fixedUser));
          setUser(fixedUser);
          setUserProfile(fixedUser);
          return { data: { user: fixedUser }, error: null };
        }

        setUser(user);
        setUserProfile(user);

        return { data: { user }, error: null };
      } catch (authError) {
        console.log('⚠️ Auth API no disponible, usando apiClient:', authError.message);

        // Fallback a apiClient original
        const response = await apiClient.post('/auth/signin', {
          email,
          password,
        });

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Sesión iniciada (fallback):', user);
        setUser(user);
        setUserProfile(user);

        return { data: { user }, error: null };
      }
    } catch (error) {
      console.error('🚨 Error en signIn:', error);
      const errorMessage = error.message || 'Error en el login';
      return {
        data: null,
        error: { message: errorMessage }
      };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      console.log('🔄 Registrando usuario con:', {
        email,
        name: userData.name,
        user_type: userData.user_type
      });

      // Intentar con authClient primero
      try {
        const response = await authClient.signUp({
          email,
          password,
          name: userData.name,
          user_type: userData.user_type,
          phone: userData.phone || ''
        });

        const user = response.user;
        const token = response.session?.access_token || 'local_token_' + user.id;

        // Guardar token y usuario en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Usuario registrado en MySQL:', user);
        setUser(user);
        setUserProfile(user);

        return { data: { user }, error: null };
      } catch (authError) {
        console.log('⚠️ Auth API no disponible, usando apiClient:', authError.message);

        // Fallback a apiClient original
        const response = await apiClient.post('/auth/signup', {
          email,
          password,
          name: userData.name,
          user_type: userData.user_type
        });

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Usuario registrado (fallback):', user);
        setUser(user);
        setUserProfile(user);

        return { data: { user }, error: null };
      }
    } catch (error) {
      console.error('🚨 Error en signUp:', error);
      const errorMessage = error.message || 'Error en el registro';
      return {
        data: null,
        error: { message: errorMessage }
      };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Cerrando sesión...');

      // Limpiar localStorage
      apiSignOut();

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
      console.log('🔄 Obteniendo perfil de usuario:', userId);

      const response = await apiClient.get(`/users/${userId}`);
      const userData = response.data;

      if (userData) {
        console.log('✅ Perfil encontrado:', userData);
        setUserProfile(userData);
        // Actualizar también el localStorage
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('ℹ️ Perfil no encontrado');
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
      return {
        data: null,
        error: { message: errorMessage }
      };
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
      return {
        data: null,
        error: { message: errorMessage }
      };
    }
  };

  const updateProfile = async () => {
    if (userProfile && userProfile.id) {
      await fetchUserProfile(userProfile.id);
    }
  };

  const updateProfileLocally = (updatedData) => {
    try {
      const updatedProfile = { ...userProfile, ...updatedData };
      setUserProfile(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      console.log('✅ Perfil actualizado localmente:', updatedProfile);
    } catch (error) {
      console.error('Error actualizando perfil localmente:', error);
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
    updateProfile,
    updateProfileLocally
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