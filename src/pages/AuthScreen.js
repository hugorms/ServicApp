import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, ArrowLeft, Briefcase, Wrench } from 'lucide-react';

const AuthScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [userType, setUserType] = useState(location.state?.userType || 'contractor');
  const [isLogin, setIsLogin] = useState(
    new URLSearchParams(location.search).get('mode') !== 'register'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    let value = e.target.value;
    
    // Capitalizar automáticamente nombres y apellidos
    if (e.target.name === 'firstName' || e.target.name === 'lastName') {
      value = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          // Detectar si el usuario no existe
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('Email not confirmed') ||
              error.message.includes('User not found') ||
              error.message.includes('Invalid credentials') ||
              error.code === 'invalid_credentials') {
            throw new Error('❌ Usuario no encontrado o credenciales incorrectas. Verifica tu email y contraseña.');
          }
          throw error;
        }
      } else {
        // Creando cuenta
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        if (formData.password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        const { error } = await signUp(formData.email, formData.password, {
          name: `${formData.firstName} ${formData.lastName}`,
          user_type: userType
        });
        
        if (error) {
          // Si el email ya existe, cambiar automáticamente a modo login
          if (error.message.includes('User already registered') || 
              error.message.includes('already registered') ||
              error.message.includes('email already exists') ||
              error.message.includes('email address already in use') ||
              error.message.includes('duplicate key value') ||
              error.code === '23505' ||
              error.status === 400) {
            setIsLogin(true);
            // Limpiar campos de registro pero conservar email y password
            setFormData(prev => ({
              ...prev,
              firstName: '',
              lastName: '',
              confirmPassword: ''
            }));
            setError(''); // Sin mensaje, solo cambiar a login silenciosamente
            return;
          }
          throw error;
        } else {
          // Registro exitoso - navegar al formulario de registro correspondiente
          if (userType === 'worker') {
            navigate('/worker-registration');
          } else {
            navigate('/contractor-registration');
          }
          return;
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-100 overflow-y-auto flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-sm p-4">
          
          {/* Header con botón de retroceso */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-800" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h1>
            </div>
            <div className="w-8"></div>
          </div>


          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Nombre"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                      required={!isLogin}
                      autoCapitalize="words"
                      autoCorrect="on"
                      autoComplete="given-name"
                      spellCheck="true"
                      inputMode="text"
                      enterKeyHint="next"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Apellido"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                      required={!isLogin}
                      autoCapitalize="words"
                      autoCorrect="on"
                      autoComplete="family-name"
                      spellCheck="true"
                      inputMode="text"
                      enterKeyHint="next"
                    />
                  </div>
                </div>
                
                {/* Selección de tipo de usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    ¿Cómo planeas usar ServicApp?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType('contractor')}
                      className={`group relative p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                        userType === 'contractor' 
                          ? 'border-yellow-500 bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-sm' 
                          : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-sm hover:border-yellow-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center transition-all ${
                          userType === 'contractor' 
                            ? 'bg-slate-800 shadow-sm' 
                            : 'bg-gradient-to-br from-slate-600 to-slate-700 group-hover:from-slate-700 group-hover:to-slate-800'
                        }`}>
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <h3 className={`text-xs font-bold mb-1 ${
                          userType === 'contractor' ? 'text-slate-800' : 'text-gray-900'
                        }`}>
                          Contratista
                        </h3>
                        <p className={`text-xs leading-tight ${
                          userType === 'contractor' ? 'text-slate-800' : 'text-gray-600'
                        }`}>
                          Publico trabajos y contrato servicios
                        </p>
                      </div>
                      {userType === 'contractor' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('worker')}
                      className={`group relative p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                        userType === 'worker' 
                          ? 'border-yellow-500 bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-sm' 
                          : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-sm hover:border-yellow-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center transition-all ${
                          userType === 'worker' 
                            ? 'bg-yellow-700 shadow-sm' 
                            : 'bg-gradient-to-br from-yellow-500 to-yellow-600 group-hover:from-yellow-600 group-hover:to-yellow-700'
                        }`}>
                          <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <h3 className={`text-xs font-bold mb-1 ${
                          userType === 'worker' ? 'text-slate-800' : 'text-gray-900'
                        }`}>
                          Trabajador
                        </h3>
                        <p className={`text-xs leading-tight ${
                          userType === 'worker' ? 'text-slate-800' : 'text-gray-600'
                        }`}>
                          Ofrezco mis servicios profesionales
                        </p>
                      </div>
                      {userType === 'worker' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="ejemplo@correo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirma tu contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
                  required={!isLogin}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-slate-800 py-3 px-6 rounded-lg font-semibold text-base shadow-sm hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </button>

          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-700 hover:text-yellow-600 hover:underline text-sm transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-2 text-center">
              <Link
                to="/forgot-password"
                className="text-slate-700 hover:text-yellow-600 hover:underline text-sm transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;