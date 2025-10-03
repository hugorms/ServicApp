const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Cliente API con fetch nativo
const apiClient = {
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Manejar logout automático en 401
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired');
      }

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      // Intentar parsear JSON, si falla devolver text
      const data = await response.json().catch(async () => {
        return await response.text();
      });

      return { data };
    } catch (error) {
      throw error;
    }
  }
};

export { apiClient };

// Helper function para manejar errores de API
export const handleApiError = (error) => {
  console.error('API error:', error);

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado. Por favor intenta de nuevo.';
};

// Helper function para obtener el usuario actual
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function para obtener el token actual
export const getCurrentToken = () => {
  return localStorage.getItem('token');
};

// Helper function para logout
export const signOut = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return { error: null };
};

// Helper function para obtener el perfil completo del usuario
export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Helper function para actualizar el perfil del usuario
export const updateUserProfile = async (userId, updates) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, updates);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: handleApiError(error) };
  }
};

// Export default
export default apiClient;