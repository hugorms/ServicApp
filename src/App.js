import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import PhoneFrame from './components/PhoneFrame';
import WelcomeScreen from './pages/WelcomeScreen';
import AuthScreen from './pages/AuthScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import UpdatePasswordScreen from './pages/UpdatePasswordScreen';
import RegistroTrabajador from './pages/RegistroTrabajador';
import RegistroContratista from './pages/RegistroContratista';
import CompleteProfileScreen from './pages/CompleteProfileScreen';
import MobileAppLayout from './pages/MobileAppLayout';

function AppContent() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [profileTimeout, setProfileTimeout] = React.useState(false);

  // Timeout para evitar cuelgue infinito en "Verificando perfil..."
  React.useEffect(() => {
    if (user && userProfile === null && !loading) {
      // Iniciando timeout para verificación de perfil
      const timeoutId = setTimeout(() => {
        // Timeout alcanzado - asumiendo perfil no encontrado
        setProfileTimeout(true);
      }, 5000); // 5 segundos timeout

      return () => clearTimeout(timeoutId);
    } else {
      setProfileTimeout(false);
    }
  }, [user, userProfile, loading]);

  // Debug para entender por qué va al registro
  React.useEffect(() => {
    if (userProfile && userProfile !== 'NOT_FOUND') {
      console.log('🔍 Debug App.js - userProfile:', userProfile);
      console.log('📱 user_type:', userProfile.user_type);
      console.log('📞 phone:', userProfile.phone);
      console.log('🏢 company_name:', userProfile.company_name);
      console.log('✅ profile_completed:', userProfile.profile_completed);
    }
  }, [userProfile]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si hay usuario autenticado pero userProfile es null (todavía cargando), ESPERAR con timeout
  if (user && userProfile === null && !loading && !profileTimeout) {
    // Usuario autenticado pero userProfile null - ESPERANDO fetchUserProfile

    // Mostrar loading mientras fetchUserProfile termina
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando perfil...</p>
          <p className="mt-1 text-xs text-gray-500">Consultando datos existentes</p>
        </div>
      </div>
    );
  }

  // Si se agotó el timeout, asumir que es un usuario nuevo
  if (user && userProfile === null && profileTimeout) {
    // Timeout - tratando como usuario nuevo
    // Simular userProfile NOT_FOUND para que vaya al WelcomeScreen
    const simulatedUserProfile = 'NOT_FOUND';
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {!user ? (
        // USUARIO NO LOGUEADO
        <>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/update-password" element={<UpdatePasswordScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : userProfile === 'NOT_FOUND' ? (
        // USUARIO LOGUEADO SIN PERFIL - elegir tipo
        <>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : userProfile && userProfile.user_type === 'worker' && (!userProfile.phone || !userProfile.profession) ? (
        // TRABAJADOR INCOMPLETO - SIN MobileAppLayout (directo en PhoneFrame)
        <>
          <Route path="/" element={<RegistroTrabajador />} />
          <Route path="/worker-registration" element={<RegistroTrabajador />} />
          <Route path="/update-password" element={<UpdatePasswordScreen />} />
          <Route path="*" element={<Navigate to="/worker-registration" replace />} />
        </>
      ) : userProfile && userProfile.user_type === 'contractor' && (!userProfile.phone || !userProfile.profession) ? (
        // CONTRATISTA INCOMPLETO - SIN MobileAppLayout (directo en PhoneFrame)
        // Nota: Ya no verificamos company_name porque puede ser null en registro personal
        <>
          <Route path="/" element={<RegistroContratista />} />
          <Route path="/contractor-registration" element={<RegistroContratista />} />
          <Route path="/update-password" element={<UpdatePasswordScreen />} />
          <Route path="*" element={<Navigate to="/contractor-registration" replace />} />
        </>
      ) : (
        // USUARIO COMPLETO - app principal CON MobileAppLayout
        <>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/app" element={<MobileAppLayout />} />
          <Route path="/complete-profile" element={<CompleteProfileScreen />} />
          <Route path="/update-password" element={<UpdatePasswordScreen />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    
      <AuthProvider>
      <Router>
        <PhoneFrame>
          <AppContent />
        </PhoneFrame>
      </Router>
    </AuthProvider>
    
  );
}

export default App;