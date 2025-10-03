// Cliente de autenticación para API MySQL
const API_BASE_URL = 'http://localhost:3009/api';

class AuthClient {
  // Registrar usuario
  async signUp(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error en el registro');
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('Error en signup:', error);
      throw error;
    }
  }

  // Iniciar sesión
  async signIn(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error en el login');
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('Error en signin:', error);
      throw error;
    }
  }

  // Verificar conexión
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/test`);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Auth API no disponible');
      return false;
    }
  }
}

export const authClient = new AuthClient();